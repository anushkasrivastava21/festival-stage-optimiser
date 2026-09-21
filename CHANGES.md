# What changed and why

## 1. Spotify can no longer supply the data or the audio

Since 27 November 2024, Spotify returns 403 to new apps for the audio-features endpoint and no longer fills `preview_url`. The PRD depended on both. Changes:

- `ml/cluster_tracks.py` reads a Kaggle Spotify-features CSV (or builds a synthetic catalogue for offline demos) instead of calling the API.
- The player synthesizes a beat at each track's real tempo, shaped by the vibe's energy. If a track has an `audio_url` pointing to a file you own, that file plays instead.
- The slide claim of "1M songs" should be reduced to the real dataset size (about 114k in the common Kaggle export; the demo seed uses 1,200).

## 2. The ER cardinalities were wrong

`live_queue` holds `stage_id` and `track_id` as foreign keys, so:

- STAGES 1 : N LIVE_QUEUE (a stage has many queued tracks), not 1 : 1.
- TRACKS 1 : N LIVE_QUEUE (a track can be queued many times), not LIVE_QUEUE 1 : N TRACKS.

Update the ER diagram on the slides to match. The other three relationships were correct.

## 3. The schema was inconsistent across the slides, TRD and docs

The slides, TRD and chat drafts used different names and columns. One schema now covers every feature the PRD asks for:

| Added | Why |
|---|---|
| `stages.current_cluster_id` | The procedure needs to know the failing vibe to find its neighbour. |
| `stages.manual_override`, `threshold`, `window_seconds`, `cooldown_seconds` | Admin override and tunable autopilot, all in the DB. |
| `stages.total_votes` | A counter the load test compares with the row count to prove zero lost updates. |
| `vibe_clusters.energy_level` + `cluster_adjacency` | "Adjacent, higher-energy vibe" needs both; adjacency comes from nearest K-Means centroids. |
| `tracks.tempo`, `audio_url`, `duration_ms` | Playback and the tempo-matched beat. |
| `live_votes.session_id` | Rate limiting per phone without user accounts. |
| `vibe_shift_log` | The PRD's audit log had no table. |
| `live_queue.started_at` | Lets the DB decide when a track has finished. |

Status is now `'queued' | 'playing' | 'played'` with a CHECK constraint instead of a `NUMBER(1)` code, and a partial unique index guarantees one playing track per stage. The Oracle-style `NUMBER`/`VARCHAR2` types from the handwritten EER were replaced with PostgreSQL types.

## 4. The autopilot would have fired on every vote

With an all-time sum, once the score passed -50 it stayed there, so every later vote would rewrite the queue again. Now:

- The score is a sliding window (last 60 s) counted only since the last pivot, so a pivot resets it.
- A 20-second cooldown stops back-to-back pivots.
- Only `queued` rows are deleted; played history is kept, and the procedure cuts straight to the first new track.

## 5. Two-phase locking is now explicit and correct

The slide said locks are released "after the math". Under strict 2PL, locks are held until COMMIT. `fn_vote_before` takes `SELECT ... FOR UPDATE` on the stage row (growing phase) and PostgreSQL releases it at commit (shrinking phase), which serializes every vote on that stage. The isolation level stays READ COMMITTED on purpose: with explicit row locks it is safe, while REPEATABLE READ would abort concurrent voters with serialization errors that the dumb backend would then have to retry.

## 6. Logic removed from Node and React

Rate limiting (one vote per phone every 3 s), choosing the track a vote applies to, advancing the queue and topping it up all run in PL/pgSQL. The backend only runs one SQL statement per route and maps DB error codes (`FS404`, `FS409`, `FS429`) to HTTP statuses. Many phones report "track ended" at once, so `sp_advance_queue` is idempotent.

## 7. Docker setup fixed

- The browser cannot resolve `backend:3001`, so Vite now proxies `/api` to the backend. Phones on the same Wi-Fi work too.
- A health check makes the backend wait until Postgres has finished running the init scripts.
- Obsolete `version:` key removed.
- The seed must be regenerated and the volume reset (`docker compose down -v`) whenever SQL changes; the README says so.

## 8. Docs that disagree with the build

ROADMAP mentions Supabase and an earlier draft mentions Next.js; the build uses local PostgreSQL in Docker and React with Vite. Update those lines before submission, and update the TRD schema section to match `db/schema.sql`.
