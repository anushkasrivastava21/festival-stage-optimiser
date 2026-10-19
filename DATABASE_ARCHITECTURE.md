# Database Architecture: Festival Stage Optimizer

This document explains the technical architecture of the Festival Stage Optimizer purely from a Database Management System (DBMS) perspective. The entire business logic (vibe scoring, threshold monitoring, and queue rotation) is pushed down to the data tier using PostgreSQL features such as triggers, stored procedures, and strong constraints.

## Entity-Relationship Schema

Below is the ER Diagram of the system:

![Database Schema](./schema.png)

## Core Entities and Relationships

The schema is heavily normalized to 3NF and utilizes strict relational constraints.

1. **`vibe_clusters` (Reference Data)**
   - **Role:** Defines the music genres/vibes.
   - **Constraints:** `vibe_name` is UNIQUE. `energy_level` has a `CHECK` constraint (1-10).
   - **Relations:** 1-to-N with `tracks`, 1-to-N with `stages` (as `current_cluster_id`).

2. **`cluster_adjacency` (Self-Referencing M:N)**
   - **Role:** A directed graph mapping which vibes can smoothly transition into one another.
   - **Constraints:** Composite Primary Key (`from_cluster`, `to_cluster`). `CHECK (from_cluster <> to_cluster)` prevents self-loops.

3. **`tracks` (Main Entity)**
   - **Role:** The catalog of songs.
   - **Constraints:** `duration_ms` and `tempo` enforce `CHECK > 0`.
   - **Relations:** Foreign Key to `vibe_clusters`.

4. **`stages` (State Management Entity)**
   - **Role:** Maintains the real-time state of a festival stage.
   - **Key Fields:** `current_vibe_score` (the sliding window score), `manual_override` (boolean).
   - **Constraints:** `threshold`, `window_seconds`, and `cooldown_seconds` all have strict `CHECK` constraints. `current_vibe_score` and `total_votes` are materialized aggregates.

5. **`live_queue` (Transactional Entity)**
   - **Role:** The upcoming playlist for a stage.
   - **Constraints:** `status` uses a `CHECK` constraint (`IN ('queued', 'playing', 'played')`). `play_order` is UNIQUE per `stage_id`. Uses `ON DELETE CASCADE` from `stages`.

6. **`live_votes` (High-Volume Transactional Entity)**
   - **Role:** Stores every individual audience vote.
   - **Constraints:** `vote_val` uses `CHECK IN (-1, 1)`.

7. **`vibe_shift_log` (Audit Entity)**
   - **Role:** An append-only audit trail logging every time the system changes vibes.
   - **Constraints:** `reason` enforces an ENUM-like `CHECK` (e.g., `autopilot`, `manual`).

---

## DBMS Business Logic Implementation

Unlike typical CRUD apps where Node.js handles logic, this project uses the DBMS to guarantee atomic state transitions and prevent race conditions (lost updates) under high concurrent load.

### 1. The Trigger: Active State Monitoring
When a high volume of rows are inserted into `live_votes`, a **Database Trigger** fires `AFTER INSERT`. 
- **The Process:** The trigger dynamically recalculates the sliding-window sum of `vote_val` for the last `window_seconds` (using the `vote_time` timestamp).
- **Concurrency Control:** It uses `SELECT ... FOR UPDATE` (Row-Level Locking) on the `stages` table. This Two-Phase Locking (2PL) ensures that concurrent votes do not cause lost updates when updating `stages.current_vibe_score` and `stages.total_votes`.
- **Decision Making:** If the new `current_vibe_score` falls below the `stages.threshold`, and `manual_override` is FALSE, and the `cooldown_seconds` have passed, the trigger immediately invokes a Stored Procedure to execute a pivot.

### 2. Stored Procedures: The Autopilot Pivot
When the trigger detects a threshold breach, it calls a **Stored Procedure** (`sp_pivot_vibe`).
- **Transactionality:** The procedure executes entirely within the same transaction block as the initial vote insert. If anything fails, the entire vote and pivot roll back atomically.
- **Query Logic:** 
  1. It queries `cluster_adjacency` to find a neighbor cluster. 
  2. It deletes all future `queued` rows in `live_queue` for that stage.
  3. It inserts new randomly ordered tracks from the new cluster into `live_queue`.
  4. It updates `stages.current_cluster_id`.
  5. It performs an `INSERT` into `vibe_shift_log` with the reason `'autopilot'`.

### 3. ACID Compliance
By keeping this logic in the DBMS, the system is fully ACID compliant. A burst of 1,000 concurrent votes (inserts) will queue up at the Row-Level Lock on the `stages` table. The database guarantees that exactly one transaction will push the score past the threshold, and exactly one pivot will occur, without the Node.js backend needing distributed locks or Redis.
