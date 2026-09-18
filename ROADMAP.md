# Step-by-Step Project Roadmap

This document outlines the exact sequence of steps required to build the Crowdsourced Festival Stage Optimizer from scratch to the final working product. 

## Phase 1: Foundation & Setup
1. **Repository Configuration**: Set up the Git repository, `.gitignore`, and `README.md`.
2. **Environment Scaffold**: 
   - Initialize the Node.js/Express backend (`npm init`).
   - Initialize the React frontend (`npm create vite@latest`).
   - Initialize the Python ML environment (`python -m venv venv`).
3. **API Keys Acquisition**: Register an application on the Spotify Developer Dashboard to get `CLIENT_ID` and `CLIENT_SECRET` for track fetching.

## Phase 2: Database Schema & Core Engine
4. **ER Modeling**: Finalize the 3NF schema for `Stages`, `Vibe_Clusters`, `Tracks`, `Live_Queue`, and `Live_Votes`.
5. **Schema Migration**: Write the `schema.sql` file to create the tables with strict primary/foreign keys and `CHECK` constraints.
6. **Supabase / Postgres Setup**: Spin up a PostgreSQL database instance (via Supabase) and apply the schema.

## Phase 3: Offline Machine Learning (Music Sourcing)
7. **Spotify Data Extraction**: Write a Python script (`extract.py`) to fetch tracks from various Spotify playlists along with their audio features (energy, tempo, acousticness).
8. **K-Means Clustering**: Use `scikit-learn` in Python to cluster the tracks into 5-7 distinct "vibes."
9. **Database Seeding**: Export the clustered tracks into a `seed.sql` script and execute it against the PostgreSQL database to populate `Vibe_Clusters` and `Tracks`.

## Phase 4: Database Autopilot (PL/pgSQL)
10. **Stored Procedures**: Write `sp_rewrite_queue`, which deletes unplayed tracks and selects new tracks from an adjacent cluster.
11. **Triggers**: Write the `trg_check_vibe_score` trigger on the `Live_Votes` table to automatically call `sp_rewrite_queue` when the vibe drops below the threshold.
12. **Concurrency Locking**: Implement `SELECT ... FOR UPDATE` in the vote calculation to ensure 2PL (Two-Phase Locking).

## Phase 5: The Backend Bridge
13. **Express Server**: Set up the Node.js server with `pg` (node-postgres) to connect to the database.
14. **API Routes**:
    - `GET /api/queue` (Fetches the current `Live_Queue`).
    - `POST /api/vote` (Inserts a row into `Live_Votes`).
    - `GET /api/admin/stats` (Fetches current vibe score, vote logs, and cluster info).

## Phase 6: The Frontend Interfaces
15. **React Router**: Configure two main routes in the single React application: `/audience` and `/admin`.
16. **Audience Interface**:
    - Build the Web Audio player using Spotify's 30-second `preview_url`.
    - Build the Queue View component.
    - Build the Voting Button components (Love/Hate) linked to the `/api/vote` endpoint.
17. **Admin Interface**:
    - Build the real-time Vibe Score dashboard.
    - Build the Audit Log component to display DB-driven vibe shifts.
    - Implement the "Manual Override" toggle.

## Phase 7: Testing & Presentation Prep
18. **Load Testing**: Write a Node.js script (`load_test.js`) to simulate 1,000 concurrent votes to prove the Two-Phase Locking works perfectly without lost updates.
19. **End-to-End Test**: Run the React frontend, start the music, use the load tester to spam downvotes, and watch the DB autonomously rewrite the queue on the screen.
20. **Documentation**: Finalize the architecture and TRD for the professor's review.
