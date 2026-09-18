# Technical Requirements Document (TRD)

## Tech Stack
- **Database Engine (The Core)**: PostgreSQL. Handles strict relational integrity, ACID transactions, 2PL concurrency, and PL/pgSQL trigger automation.
- **ML Pipeline (Offline ETL)**: Python + Scikit-learn. Handles offline K-Means clustering to analyze audio metadata (BPM, energy) and write `cluster_id`s to the DB.
- **Backend API (The Bridge)**: Node.js + Express. A thin read/write relay (ODBC/JDBC broadcaster) passing commands between UI and DB.
- **Frontend (The Dumb Player)**: React. Contains the audio player, Audience UI, and Admin UI. Does NO business logic.

## Database Schema (3NF/BCNF)
The database must be normalized to at least 3NF to prevent data redundancy.
1. `Vibe_Clusters`: `cluster_id` (PK), `vibe_name`
2. `Tracks`: `track_id` (PK), `cluster_id` (FK), `title`, `artist_name`, `duration_ms`, `audio_url`
3. `Stages`: `stage_id` (PK), `stage_name`, `current_vibe_score`, `manual_override`
4. `Live_Queue`: `queue_id` (PK), `stage_id` (FK), `track_id` (FK), `play_order`, `status`
5. `Live_Votes`: `vote_id` (PK), `stage_id` (FK), `track_id` (FK), `vote_value`, `vote_timestamp`

## Concurrency Control
- **Two-Phase Locking (2PL)**: Must be explicitly implemented for the `Live_Votes` and `Stages` tables to handle concurrent vote inserts and score updates safely.
- **Isolation Level**: Repeatable Read or Serializable for critical transactions.

## Database Automation (PL/pgSQL)
- **Trigger**: `trg_check_vibe_score` on `Live_Votes` inserts.
- **Stored Procedure**: `sp_rewrite_queue`. If the vibe score drops below a threshold (e.g., -50) and `manual_override` is false, clear `Live_Queue` for that stage and insert random tracks from an adjacent `cluster_id`.
