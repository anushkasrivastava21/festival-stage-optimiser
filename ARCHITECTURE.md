# Architecture

The system is designed with a "Thick Database" architecture. The business logic lives entirely inside the database layer to prove advanced DBMS concepts.

## Phase A: Before the Event (Offline ETL)
1. **Extract**: Python script reads a massive raw audio dataset (e.g., Kaggle/Spotify API).
2. **Transform**: K-Means clustering algorithm groups tracks by acousticness, danceability, energy, and tempo into distinct clusters.
3. **Load**: Python executes SQL `INSERT` commands to seed the `Vibe_Clusters` and `Tracks` tables in PostgreSQL.

## Phase B: During the Event (The Dumb Layers)
- **React Frontend**: Pings the backend for "what's playing next" and renders the Audience/Admin UIs. Passes votes to the backend.
- **Node.js Backend**: Exposes basic REST endpoints (`POST /vote`, `GET /queue`, `GET /admin/stats`). It performs zero logic and simply passes data to/from PostgreSQL.

## Phase C: The Brain (Database Logic)
- **Vote Ingestion**: Votes hit the `Live_Votes` table. 2PL ensures zero lost updates.
- **Score Calculation**: A trigger updates `Stages.current_vibe_score` using a sliding window or absolute sum.
- **Queue Pivot**: If the score hits the failure threshold, the DB executes a stored procedure autonomously. It runs `DELETE` on upcoming queued tracks and `INSERT` on new tracks from a different cluster.
- **Admin Override**: If `Stages.manual_override` is true, the autopilot pauses, demonstrating an understanding of failure modes and manual intervention.
