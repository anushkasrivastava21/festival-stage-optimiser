# TRD — The Crowdsourced Festival Stage Optimizer
**Author:** Anushka Srivastava (25BCE5388)
**Version:** 1.0

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Database | **PostgreSQL** | PL/pgSQL triggers/stored procedures for autonomous logic, strong transaction isolation (2PL) |
| Backend | Node.js (Express) or Supabase (given prior stack experience) | Thin — only relays votes, no business logic |
| Frontend | Next.js | Voting UI + live queue player, real-time via polling/websockets/Supabase Realtime |
| Offline ML | Python (scikit-learn) | K-Means clustering of the track catalogue into Vibe Clusters, run once pre-event |
| Realtime transport | Supabase Realtime / WebSockets / polling | Push queue changes to frontend without server-side decision logic |

**Rule:** the backend is a **dumb relay**. Any temptation to add "if vibe_score < -50 then..." in application code is a TRD violation — that logic belongs in the database (see Architecture doc).

## 2. Data Model (from EER — final)

### Stages
| Attribute | Type | Constraint |
|---|---|---|
| stage_id | NUMBER(5) | PRIMARY KEY |
| stage_name | VARCHAR2(30) | NOT NULL |
| curr_vibe_score | NUMBER(3) | NOT NULL |

### Live_Queue
| Attribute | Type | Constraint |
|---|---|---|
| queue_id | NUMBER(5) | PRIMARY KEY |
| stage_id | NUMBER(5) | FOREIGN KEY → Stages |
| track_id | NUMBER(10) | FOREIGN KEY → Tracks |
| play_order | NUMBER(3) | NOT NULL |
| status | NUMBER(1) | NOT NULL |

### Live_Votes
| Attribute | Type | Constraint |
|---|---|---|
| vote_id | NUMBER(10) | PRIMARY KEY |
| stage_id | NUMBER(5) | FOREIGN KEY → Stages |
| track_id | NUMBER(10) | FOREIGN KEY → Tracks |
| vote_val | NUMBER(3) | NOT NULL |
| vote_time | TIMESTAMP | NOT NULL |

### Tracks
| Attribute | Type | Constraint |
|---|---|---|
| track_id | NUMBER(10) | PRIMARY KEY |
| cluster_id | NUMBER(5) | FOREIGN KEY → Vibe_Clusters |
| title | VARCHAR2(30) | NOT NULL |
| artist_name | VARCHAR2(30) | NOT NULL |
| duration | NUMBER(10) | NOT NULL |

### Vibe_Clusters
| Attribute | Type | Constraint |
|---|---|---|
| cluster_id | NUMBER(5) | PRIMARY KEY |
| vibe_name | VARCHAR2(30) | NOT NULL |

**Relationships (from ER model):**
- Stages `1 —(receives)— N` Live_Votes
- Stages `1 —(queue)— 1` Live_Queue (per active queue context) → Live_Queue `1 —(queued as)— N` Tracks
- Tracks `1 —(voted on)— N` Live_Votes
- Vibe_Clusters `1 —(has)— N` Tracks

## 3. Concurrency Control
- **Threat:** vote spikes → thousands of simultaneous writes to `Live_Votes` → lost updates if unmanaged.
- **Fix:** strict transaction isolation + **Two-Phase Locking (2PL)**.
  - Phase 1 (growing): acquire row locks on relevant `Live_Votes`/`Stages` rows.
  - Execute vibe-score recalculation.
  - Phase 2 (shrinking): release locks only after commit.
- Use `SELECT ... FOR UPDATE` on the `Stages` row being updated to serialize score writes per stage (locks are per-stage, not global — stages remain independent under load).

## 4. Database Automation Logic
1. **Trigger** (`AFTER INSERT ON Live_Votes`): recompute `Stages.curr_vibe_score` for that `stage_id`.
2. **Threshold check** inside trigger: if `curr_vibe_score < -50` →
3. **Stored procedure** (`pivot_vibe(stage_id)`):
   - Identify current cluster from the currently playing track.
   - Select an adjacent higher-energy `cluster_id` (rule-based mapping or nearest-cluster-by-centroid distance, precomputed by the offline ML job).
   - `DELETE` stale rows from `Live_Queue` for that stage.
   - `INSERT` new track order sourced from the selected cluster.
   - Reset `curr_vibe_score` to a neutral baseline (e.g. 0) after pivot.
4. Frontend has **no polling logic beyond "read Live_Queue"** — it never evaluates vibe scores itself.

## 5. Offline ML Job (Python)
- Input: track catalogue (title, artist, audio features — tempo/energy/valence if available, else genre metadata as proxy).
- Algorithm: K-Means (choose k via elbow method / silhouette score).
- Output: `cluster_id` assignment per track + a cluster adjacency map (which clusters are "energy-adjacent" to which) — this adjacency map is what the stored procedure consults for pivots.
- Run once pre-event; results loaded into `Vibe_Clusters` + `Tracks.cluster_id` via a seed script.

## 6. Non-Functional Requirements
- Vote → score update latency: < 1s at the DB layer.
- Support ≥ 5,000 concurrent votes/sec per stage without lost updates (2PL verified via load test).
- Idempotent seed scripts for `Vibe_Clusters`/`Tracks` (re-runnable without duplication).

## 7. API Surface (thin relay only)
| Endpoint | Method | Purpose |
|---|---|---|
| `/stages/:id/current` | GET | Current track + vibe score (read from DB) |
| `/stages/:id/vote` | POST | Insert a row into `Live_Votes` |
| `/stages/:id/queue` | GET | Current `Live_Queue` for playback |

No endpoint contains threshold or pivoting logic — that's a DB-only concern (see Rules doc, Rule 1).
