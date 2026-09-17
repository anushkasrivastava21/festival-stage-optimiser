# The Crowdsourced Festival Stage Optimizer
A 100% autonomous, ML-integrated event data engine. Attendees vote live on stage music; PostgreSQL itself detects a dying crowd energy and autonomously rewrites the playlist — no human DJ, no application-layer decision logic.

**Author:** Anushka Srivastava (25BCE5388)

## Docs
- [`PRD.md`](./PRD.md) — what we're building and why
- [`TRD.md`](./TRD.md) — schema, stack, concurrency model
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system diagram, ERD, folder structure
- [`RULES.md`](./RULES.md) — engineering standards, git rules, definition of done

## Core Idea
> The web server has no brain. The PostgreSQL database makes all live decisions autonomously.

1. **Offline (pre-event):** Python K-Means clusters the track catalogue into Vibe Clusters.
2. **Live:** attendees upvote/downvote → `Live_Votes` table.
3. **Autonomous:** a PL/pgSQL trigger recalculates `curr_vibe_score`; if it drops below -50, a stored procedure pivots the `Live_Queue` to an adjacent, higher-energy Vibe Cluster.
4. **Frontend:** just plays whatever `Live_Queue` says. No decisions made client-side or server-side.

## Setup
```bash
# clone
git clone <repo-url> && cd festival-stage-optimizer

# db
cd db && psql -f migrations/*.sql
psql -f seeds/vibe_clusters_seed.sql

# ml (run once, pre-event, to regenerate seeds)
cd ../ml && python cluster_tracks.py

# backend
cd ../backend && npm install && npm run dev

# frontend
cd ../frontend && npm install && npm run dev
```

## Status
🚧 In development — see `RULES.md` §9 for the pre-demo checklist.
