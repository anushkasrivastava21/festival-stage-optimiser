-- ============================================================
-- schema.sql — Core DDL for The Crowdsourced Festival Stage Optimizer
-- Author: Anushka Srivastava (25BCE5388)
-- Matches the final EER model (Stages, Live_Queue, Live_Votes,
-- Tracks, Vibe_Clusters)
-- ============================================================

-- Drop in dependency-safe order (children before parents) for clean re-runs
DROP TABLE IF EXISTS Live_Votes CASCADE;
DROP TABLE IF EXISTS Live_Queue CASCADE;
DROP TABLE IF EXISTS Tracks CASCADE;
DROP TABLE IF EXISTS Vibe_Clusters CASCADE;
DROP TABLE IF EXISTS Stages CASCADE;

-- ------------------------------------------------------------
-- Vibe_Clusters — output of the offline K-Means job
-- ------------------------------------------------------------
CREATE TABLE Vibe_Clusters (
    cluster_id   SMALLINT      PRIMARY KEY,
    vibe_name    VARCHAR(30)   NOT NULL
);

-- ------------------------------------------------------------
-- Tracks — full catalogue, each pre-assigned to a Vibe_Cluster
-- ------------------------------------------------------------
CREATE TABLE Tracks (
    track_id     INTEGER       PRIMARY KEY,
    cluster_id   SMALLINT      NOT NULL REFERENCES Vibe_Clusters(cluster_id),
    title        VARCHAR(30)   NOT NULL,
    artist_name  VARCHAR(30)   NOT NULL,
    duration     INTEGER       NOT NULL CHECK (duration > 0)  -- seconds
);

-- ------------------------------------------------------------
-- Stages — one row per physical stage at the event
-- ------------------------------------------------------------
CREATE TABLE Stages (
    stage_id         SMALLINT     PRIMARY KEY,
    stage_name       VARCHAR(30)  NOT NULL,
    curr_vibe_score  SMALLINT     NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- Live_Queue — the autonomously-maintained play order per stage
-- status: 0 = pending, 1 = now playing, 2 = played
-- ------------------------------------------------------------
CREATE TABLE Live_Queue (
    queue_id     SERIAL       PRIMARY KEY,
    stage_id     SMALLINT     NOT NULL REFERENCES Stages(stage_id) ON DELETE CASCADE,
    track_id     INTEGER      NOT NULL REFERENCES Tracks(track_id),
    play_order   SMALLINT     NOT NULL CHECK (play_order >= 0),
    status       SMALLINT     NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)),
    UNIQUE (stage_id, play_order)
);

-- ------------------------------------------------------------
-- Live_Votes — the write-heavy table; every attendee tap lands here
-- vote_val: +1 upvote, -1 downvote (kept as NUMBER(3) per EER to allow weighting later)
-- ------------------------------------------------------------
CREATE TABLE Live_Votes (
    vote_id      BIGSERIAL    PRIMARY KEY,
    stage_id     SMALLINT     NOT NULL REFERENCES Stages(stage_id) ON DELETE CASCADE,
    track_id     INTEGER      NOT NULL REFERENCES Tracks(track_id),
    vote_val     SMALLINT     NOT NULL CHECK (vote_val IN (-1, 1)),
    vote_time    TIMESTAMP    NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Indexes — this table is write-heavy AND read for aggregation,
-- so index the columns the trigger/procedure filter on.
-- ------------------------------------------------------------
CREATE INDEX idx_live_votes_stage_time ON Live_Votes (stage_id, vote_time);
CREATE INDEX idx_live_queue_stage_order ON Live_Queue (stage_id, play_order);
CREATE INDEX idx_tracks_cluster ON Tracks (cluster_id);

-- ------------------------------------------------------------
-- Cluster adjacency — precomputed by the offline ML job.
-- Lets pivot_vibe() find a "higher-energy neighbour" cluster
-- without any live ML inference (see ml/adjacency_map.py).
-- ------------------------------------------------------------
CREATE TABLE Cluster_Adjacency (
    cluster_id           SMALLINT NOT NULL REFERENCES Vibe_Clusters(cluster_id),
    adjacent_cluster_id  SMALLINT NOT NULL REFERENCES Vibe_Clusters(cluster_id),
    energy_delta         SMALLINT NOT NULL, -- positive = adjacent cluster is higher-energy
    PRIMARY KEY (cluster_id, adjacent_cluster_id)
);
