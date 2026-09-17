# PRD — The Crowdsourced Festival Stage Optimizer
**Author:** Anushka Srivastava (25BCE5388)
**Version:** 1.0
**Status:** Draft → Build

---

## 1. Problem Statement
Human DJs read crowd energy subjectively and cannot pivot pre-planned setlists fast enough when a crowd disengages. This causes dead moments at live events with no data-backed way to recover them.

## 2. Solution Summary
A **100% autonomous, database-driven engine** where:
- Attendees vote (upvote/downvote) on the currently playing track/genre from their phones in real time.
- The **PostgreSQL database itself** — not the application server — aggregates votes, detects a failing "vibe," and rewrites the live queue.
- Songs are pre-clustered offline into **Vibe Clusters** using K-Means (Python/ML) before the event, so the DB only ever has to pick from adjacent clusters at runtime — no live ML inference needed.

> Core design principle: **"The web server has no brain."** All decision logic (thresholds, cluster pivoting, queue rewriting) lives in PL/pgSQL triggers and stored procedures, not application code.

## 3. Goals
| Goal | Success Metric |
|---|---|
| Real-time responsiveness | Vote → queue update reflected in < 3s |
| Autonomous decision-making | Zero manual DJ intervention once live |
| Data integrity under load | Zero lost votes during concurrent spikes (thousands/sec) |
| ML pre-processing | 1M-song catalogue clustered into Vibe Clusters pre-event |

## 4. Non-Goals (v1)
- No live/online ML re-training during the event.
- No user accounts/auth for voters (anonymous, rate-limited voting only).
- No multi-festival / multi-tenant support in v1 — single event, multiple stages.

## 5. Users
- **Attendee (Voter):** opens a stage-specific link/QR, sees current track, upvotes/downvotes.
- **Stage Operator (read-only, optional):** dashboard view of current vibe score and queue (v1.1 stretch).
- **System (autonomous agent):** the DB trigger/procedure layer — no human in this loop.

## 6. Core Features (v1 Scope)
1. **Live Voting** — attendee casts a vote for a stage on the currently playing track.
2. **Vibe Scoring** — votes aggregate into a rolling `curr_vibe_score` per stage.
3. **Autonomous Pivot** — when a stage's score drops below a defined threshold (e.g. **-50**), the DB automatically:
   - Identifies the failing Vibe Cluster.
   - Selects an adjacent, higher-energy cluster.
   - Rewrites the `Live_Queue` (delete stale entries, insert new track order).
4. **Live Queue Playback** — frontend player polls/subscribes to `Live_Queue` and plays whatever is next; it has no decision logic.
5. **Offline Clustering Job** — Python K-Means script groups the full track catalogue into Vibe Clusters before the event, populating `Vibe_Clusters` and `Tracks.cluster_id`.

## 7. User Flow
1. Attendee scans a QR code tied to a `stage_id`.
2. Sees currently playing track + upvote/downvote buttons.
3. Vote is written to `Live_Votes`.
4. A PL/pgSQL trigger on `Live_Votes` recalculates `Stages.curr_vibe_score`.
5. If score breaches threshold → stored procedure fires → `Live_Queue` is rewritten.
6. Frontend player detects the new queue and transitions tracks.

## 8. Success Criteria for Demo/Submission
- Live end-to-end demo: vote spam → visible autonomous playlist pivot with no app-server logic involved.
- EER + concurrency model documented and matching implementation.
- Codebase with clean git history showing PRD → schema → triggers → frontend, in that order.
