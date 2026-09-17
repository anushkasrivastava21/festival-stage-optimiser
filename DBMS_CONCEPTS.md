# DBMS_CONCEPTS.md — Theory Behind the Implementation
This maps the project's DBMS coursework concepts directly onto the schema/code in `/db`, so it doubles as your evaluation write-up.

## 1. Normalization
| Table | Check | Result |
|---|---|---|
| Stages | No repeating groups; every attribute depends only on `stage_id` | 3NF |
| Vibe_Clusters | Single non-key attribute (`vibe_name`), fully dependent on `cluster_id` | 3NF |
| Tracks | `cluster_id` is a non-transitive FK; title/artist/duration depend only on `track_id` | 3NF |
| Live_Queue | Composite uniqueness on `(stage_id, play_order)` avoids duplicate play-order entries per stage; all other attributes depend on `queue_id` | 3NF |
| Live_Votes | Every attribute (stage_id, track_id, vote_val, vote_time) depends only on `vote_id` | 3NF |

No table stores derived/redundant data **except** `Stages.curr_vibe_score`, which is a deliberate **denormalization for performance** — recomputing it from `Live_Votes` on every read would be far too expensive at vote-spike scale. This tradeoff is documented, not accidental (a hallmark of good schema design, not a violation of normalization discipline).

## 2. Keys
- **Primary keys:** `stage_id`, `queue_id`, `vote_id`, `track_id`, `cluster_id` — each a single-column surrogate key.
- **Foreign keys:** enforce every relationship shown in the EER diagram at the DB level (`ON DELETE CASCADE` on `Live_Queue.stage_id` and `Live_Votes.stage_id` — if a stage is ever removed, its live data goes with it; `Tracks.cluster_id` and `Live_Queue.track_id`/`Live_Votes.track_id` are RESTRICT by default, since deleting a track that's referenced by history shouldn't be silent).
- **Composite uniqueness constraint:** `Live_Queue (stage_id, play_order)` — a candidate key beyond the surrogate PK, preventing two tracks from claiming the same slot.

## 3. ACID Properties in This System
| Property | How it's guaranteed here |
|---|---|
| **Atomicity** | `pivot_vibe()` runs the DELETE + multiple INSERTs + score reset inside the same transaction as the triggering vote insert — either the whole pivot happens or none of it does. |
| **Consistency** | CHECK constraints (`vote_val IN (-1,1)`, `status IN (0,1,2)`, `duration > 0`) and FK constraints prevent the DB from ever entering an invalid state, even under a buggy client. |
| **Isolation** | `SELECT ... FOR UPDATE` on the `Stages` row implements Two-Phase Locking, preventing concurrent vote transactions on the same stage from reading stale scores (prevents the lost-update anomaly). |
| **Durability** | Postgres WAL (write-ahead logging) — once a vote transaction commits, it survives a crash. No project-level code needed; it's inherent to using a real RDBMS instead of an in-memory store. |

## 4. Concurrency Control — Why 2PL Specifically
- **Anomaly being prevented:** *lost update*. Two concurrent votes on the same stage both read `curr_vibe_score = -48`, both compute `-49`, both write `-49` — one vote is silently lost.
- **Mechanism:** `SELECT ... FOR UPDATE` acquires an exclusive row lock (growing phase). No other transaction can read-for-update the same row until this one commits (shrinking phase releases it). This is a practical, row-scoped application of Two-Phase Locking — not table-level locking, so unrelated stages never contend.
- **Isolation level:** Postgres default `READ COMMITTED` is sufficient here because the lock is explicit (`FOR UPDATE`), not relied upon implicitly; for stricter guarantees the transaction could be run at `REPEATABLE READ`, but that's unnecessary overhead given the explicit locking already in place.
- **Deadlock consideration:** because every vote transaction only ever locks exactly one `Stages` row (never multiple stages in one transaction), circular wait — the precondition for deadlock — cannot occur in this design.

## 5. Triggers & Stored Procedures as the Decision Engine
- `recalc_vibe_score()` — a **row-level AFTER trigger**, chosen (not a BEFORE trigger) because the vote must actually be durably inserted before it can influence the aggregate score, and chosen as row-level (not statement-level) because each vote must be evaluated individually for correct locking semantics.
- `pivot_vibe()` — a **stored procedure/function** kept separate from the trigger so it can also be invoked manually (e.g. for testing or an operator override) without re-triggering a vote insert.
- This entire trigger→procedure chain is what makes the system "autonomous": no polling job, no application-tier cron, no server-side `if` statement decides anything.

## 6. Indexing Rationale
- `idx_live_votes_stage_time (stage_id, vote_time)` — supports the trigger's implicit filtering by stage and any future "votes in the last N seconds" windowed scoring.
- `idx_live_queue_stage_order (stage_id, play_order)` — supports fast "what's playing next" reads by the frontend, and fast DELETE-by-stage during a pivot.
- `idx_tracks_cluster (cluster_id)` — supports `pivot_vibe()`'s `SELECT ... FROM Tracks WHERE cluster_id = ...` during queue rebuild.
- No index on `Live_Votes.vote_val` — it's low-cardinality (only -1/1) and always read in aggregate, not filtered directly.

## 7. Transactions Summary Table
| Transaction | Statements | Isolation mechanism |
|---|---|---|
| Cast a vote | `INSERT Live_Votes` → trigger fires | Row lock via `FOR UPDATE` on `Stages` |
| Autonomous pivot | `DELETE Live_Queue` + `INSERT Live_Queue` × N + `UPDATE Stages` | Runs inside the same transaction as the triggering vote — atomic by construction |
| Offline seed load | Bulk `INSERT` into `Vibe_Clusters`/`Tracks`/`Cluster_Adjacency` | Single batch transaction, run once pre-event, no concurrent writers |
