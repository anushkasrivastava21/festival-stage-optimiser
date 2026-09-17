# ARCHITECTURE — The Crowdsourced Festival Stage Optimizer

## System Overview
```
[Attendee Phone] --vote--> [Next.js Frontend] --POST--> [Thin Backend/API]
                                                                |
                                                                v
                                                      [PostgreSQL: Live_Votes]
                                                                |
                                                    AFTER INSERT trigger fires
                                                                |
                                                        recompute curr_vibe_score
                                                                |
                                                  score < -50? ---no---> done
                                                        |yes
                                                        v
                                              stored procedure: pivot_vibe()
                                                        |
                                          DELETE stale Live_Queue rows
                                          INSERT new tracks from adjacent
                                          Vibe_Cluster
                                                        |
                                                        v
                                          [Live_Queue table updated]
                                                        |
                                          Frontend player polls/subscribes
                                                        |
                                              plays newly queued track
```

## Layers & Ownership of Logic

| Layer | Responsibility | Explicitly NOT responsible for |
|---|---|---|
| Frontend (Next.js) | Render current track, capture votes, play whatever `Live_Queue` says | Deciding what plays next |
| Backend/API | Relay votes to DB, relay queue reads to frontend | Any threshold/business logic |
| PostgreSQL (triggers + procedures) | Score aggregation, threshold detection, queue rewriting, concurrency safety | UI, playback |
| Offline Python ML job | Pre-event clustering of the track catalogue into Vibe Clusters + adjacency map | Live/online inference |

This separation is the single most important architectural decision in this project — it is what "autonomous" means here: **the database is the decision-maker, not the app.**

## Entity Relationship Model (Final — as diagrammed)

**Entities:** Stages, Live_Queue, Live_Votes, Tracks, Vibe_Clusters

**Relationships:**
- `Stages (1) —receives→ (N) Live_Votes`
- `Stages (1) —queue→ (1) Live_Queue` per stage's active session; `Live_Queue (1) —queued as→ (N) Tracks`
- `Tracks (1) —voted on→ (N) Live_Votes`
- `Vibe_Clusters (1) —has→ (N) Tracks`

See `TRD.md` §2 for full attribute-level schema (types, PK/FK constraints) sourced from the Enhanced ER model.

## Concurrency Model
Two-Phase Locking at the **per-stage row level** on `Stages.curr_vibe_score`:
- Growing phase: `SELECT ... FOR UPDATE` locks the specific stage's row during a vote-triggered recalculation.
- Shrinking phase: lock released on commit.
- Effect: stages are independent — a vote spike on Stage A never blocks writes on Stage B; only concurrent writers to the *same* stage serialize.

## Deployment Shape (suggested)
- PostgreSQL: managed instance (Supabase/Neon/RDS) — triggers/procedures live in migration files, not clicked in manually.
- Backend: serverless functions or a small Express service — stateless, horizontally scalable (it's just a relay).
- Frontend: Next.js on Vercel — stage pages statically parameterized by `stage_id`.
- ML job: one-off Python script/notebook, run pre-event, output loaded via a seed migration.

## Folder Structure
```
/festival-stage-optimizer
├── /db
│   ├── /migrations        # schema: tables, constraints
│   ├── /triggers          # AFTER INSERT trigger on Live_Votes
│   ├── /procedures        # pivot_vibe() stored procedure
│   └── /seeds             # Vibe_Clusters + Tracks seed data (from ML job output)
├── /ml
│   ├── cluster_tracks.py  # K-Means clustering job
│   └── adjacency_map.py   # builds cluster adjacency table
├── /backend
│   └── /routes            # thin relay endpoints only
├── /frontend
│   └── /app               # Next.js — voting UI + live queue player
├── ARCHITECTURE.md
├── PRD.md
├── TRD.md
├── RULES.md
└── README.md
```
