-- =====================================================================
-- The Crowdsourced Festival Stage Optimizer : schema (3NF)
-- Runs first on a fresh Postgres volume (docker-entrypoint-initdb.d).
-- =====================================================================

-- Vibes produced by the offline K-Means job. energy_level lets the
-- autopilot pick an "adjacent, higher-energy" vibe.
CREATE TABLE vibe_clusters (
    cluster_id    SMALLINT     PRIMARY KEY,
    vibe_name     VARCHAR(30)  NOT NULL UNIQUE,
    energy_level  SMALLINT     NOT NULL CHECK (energy_level BETWEEN 1 AND 10)
);

-- Which vibes are "close" in feature space (nearest centroids).
-- Stored as directed pairs; the ML script writes both directions.
CREATE TABLE cluster_adjacency (
    from_cluster  SMALLINT NOT NULL REFERENCES vibe_clusters(cluster_id),
    to_cluster    SMALLINT NOT NULL REFERENCES vibe_clusters(cluster_id),
    PRIMARY KEY (from_cluster, to_cluster),
    CHECK (from_cluster <> to_cluster)
);

-- VIBE_CLUSTERS 1 --has-- N TRACKS
CREATE TABLE tracks (
    track_id     INTEGER       PRIMARY KEY,
    cluster_id   SMALLINT      NOT NULL REFERENCES vibe_clusters(cluster_id),
    title        VARCHAR(120)  NOT NULL,
    artist_name  VARCHAR(120)  NOT NULL,
    duration_ms  INTEGER       NOT NULL CHECK (duration_ms > 0),
    tempo        NUMERIC(5,1)  NOT NULL CHECK (tempo > 0),
    audio_url    TEXT          -- optional: a file you own; NULL = synthesized beat
);
CREATE INDEX idx_tracks_cluster ON tracks (cluster_id);

-- One row per stage. This is the single "hot" row every vote locks.
-- current_vibe_score and total_votes are deliberately materialised
-- (derivable from live_votes) so the trigger has exactly one row to lock
-- and the load test has a counter to verify. Documented denormalisation.
CREATE TABLE stages (
    stage_id            SMALLINT     PRIMARY KEY,
    stage_name          VARCHAR(50)  NOT NULL UNIQUE,
    current_cluster_id  SMALLINT     NOT NULL REFERENCES vibe_clusters(cluster_id),
    current_vibe_score  INTEGER      NOT NULL DEFAULT 0,
    total_votes         BIGINT       NOT NULL DEFAULT 0,
    manual_override     BOOLEAN      NOT NULL DEFAULT FALSE,
    threshold           INTEGER      NOT NULL DEFAULT -50 CHECK (threshold < 0),
    window_seconds      INTEGER      NOT NULL DEFAULT 60  CHECK (window_seconds > 0),
    cooldown_seconds    INTEGER      NOT NULL DEFAULT 20  CHECK (cooldown_seconds >= 0),
    play_seconds        INTEGER      NOT NULL DEFAULT 30  CHECK (play_seconds > 0),
    last_pivot_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- STAGES 1 --queues-- N LIVE_QUEUE N --queued as-- 1 TRACKS
CREATE TABLE live_queue (
    queue_id    BIGSERIAL    PRIMARY KEY,
    stage_id    SMALLINT     NOT NULL REFERENCES stages(stage_id) ON DELETE CASCADE,
    track_id    INTEGER      NOT NULL REFERENCES tracks(track_id),
    play_order  INTEGER      NOT NULL CHECK (play_order > 0),
    status      VARCHAR(8)   NOT NULL DEFAULT 'queued'
                             CHECK (status IN ('queued', 'playing', 'played')),
    started_at  TIMESTAMPTZ,
    UNIQUE (stage_id, play_order)
);
-- At most one track playing per stage, enforced by the DB itself.
CREATE UNIQUE INDEX uq_one_playing_per_stage ON live_queue (stage_id) WHERE status = 'playing';

-- STAGES 1 --receive-- N LIVE_VOTES N --voted on-- 1 TRACKS
-- session_id = anonymous device id (no user accounts, by design).
CREATE TABLE live_votes (
    vote_id     BIGSERIAL    PRIMARY KEY,
    stage_id    SMALLINT     NOT NULL REFERENCES stages(stage_id),
    track_id    INTEGER      NOT NULL REFERENCES tracks(track_id),  -- filled by trigger
    session_id  UUID         NOT NULL,
    vote_val    SMALLINT     NOT NULL CHECK (vote_val IN (-1, 1)),
    vote_time   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_votes_stage_time   ON live_votes (stage_id, vote_time);
CREATE INDEX idx_votes_session_time ON live_votes (session_id, stage_id, vote_time);

-- Audit trail of every decision the autopilot (or the admin) makes.
CREATE TABLE vibe_shift_log (
    log_id          BIGSERIAL    PRIMARY KEY,
    stage_id        SMALLINT     NOT NULL REFERENCES stages(stage_id),
    old_cluster_id  SMALLINT     REFERENCES vibe_clusters(cluster_id),
    new_cluster_id  SMALLINT     REFERENCES vibe_clusters(cluster_id),
    trigger_score   INTEGER,
    reason          VARCHAR(12)  NOT NULL
                    CHECK (reason IN ('autopilot', 'manual', 'override_on', 'override_off', 'no_neighbor')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_log_stage_time ON vibe_shift_log (stage_id, created_at DESC);
