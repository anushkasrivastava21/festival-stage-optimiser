-- =====================================================================
-- The autopilot: every live decision is made here, not in Node or React.
-- Procedure parameters are INT (not SMALLINT) so CALL sp_x(1) resolves.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Pick the neighbouring vibe to pivot to: prefer a higher-energy
-- neighbour (closest energy step first); if the stage is already at the
-- top of the graph, fall back to the nearest lower-energy neighbour.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_pick_adjacent_cluster(p_current INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_result INT;
BEGIN
    SELECT ca.to_cluster
      INTO v_result
      FROM cluster_adjacency ca
      JOIN vibe_clusters f ON f.cluster_id = ca.from_cluster
      JOIN vibe_clusters t ON t.cluster_id = ca.to_cluster
     WHERE ca.from_cluster = p_current
     ORDER BY (t.energy_level > f.energy_level) DESC,
              abs(t.energy_level - f.energy_level),
              random()
     LIMIT 1;

    RETURN v_result;  -- NULL when the cluster has no neighbours
END;
$$;

-- ---------------------------------------------------------------------
-- Keep p_target upcoming tracks in the queue, drawn from the stage's
-- current vibe. Uses an explicit cursor (syllabus requirement).
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_fill_queue(p_stage INT, p_target INT DEFAULT 5)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cluster  INT;
    v_missing  INT;
    v_order    INT;
    v_track    INT;
    cur_tracks CURSOR (c INT, n INT) FOR
        SELECT t.track_id
          FROM tracks t
         WHERE t.cluster_id = c
           AND NOT EXISTS (SELECT 1 FROM live_queue q
                            WHERE q.stage_id = p_stage
                              AND q.track_id = t.track_id
                              AND q.status  <> 'played')
         ORDER BY random()
         LIMIT n;
BEGIN
    SELECT current_cluster_id INTO v_cluster FROM stages WHERE stage_id = p_stage;

    SELECT p_target - count(*) INTO v_missing
      FROM live_queue WHERE stage_id = p_stage AND status = 'queued';
    IF v_missing <= 0 THEN
        RETURN;
    END IF;

    SELECT COALESCE(max(play_order), 0) INTO v_order
      FROM live_queue WHERE stage_id = p_stage;

    OPEN cur_tracks(v_cluster, v_missing);
    LOOP
        FETCH cur_tracks INTO v_track;
        EXIT WHEN NOT FOUND;
        v_order := v_order + 1;
        INSERT INTO live_queue (stage_id, track_id, play_order)
        VALUES (p_stage, v_track, v_order);
    END LOOP;
    CLOSE cur_tracks;
END;
$$;

-- ---------------------------------------------------------------------
-- Move a stage to its next track. Many audience phones report "track
-- ended" at once, so this is idempotent: it only advances if the caller
-- names the track that is actually playing and its time is up.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_advance_queue(p_stage INT, p_expected BIGINT DEFAULT NULL, p_force BOOLEAN DEFAULT FALSE)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stage   stages%ROWTYPE;
    v_cur_id  BIGINT;
    v_started TIMESTAMPTZ;
    v_secs    INT;
    v_next    BIGINT;
BEGIN
    SELECT * INTO v_stage FROM stages WHERE stage_id = p_stage FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', p_stage USING ERRCODE = 'FS404';
    END IF;

    SELECT q.queue_id, q.started_at, LEAST(CEIL(t.duration_ms / 1000.0)::INT, v_stage.play_seconds)
      INTO v_cur_id, v_started, v_secs
      FROM live_queue q JOIN tracks t ON t.track_id = q.track_id
     WHERE q.stage_id = p_stage AND q.status = 'playing';

    IF v_cur_id IS NOT NULL THEN
        IF p_expected IS NOT NULL AND v_cur_id <> p_expected THEN
            RETURN;  -- someone else already advanced this stage
        END IF;
        IF NOT p_force AND clock_timestamp() < v_started + make_interval(secs => v_secs - 2) THEN
            RETURN;  -- too early; ignore
        END IF;
        UPDATE live_queue SET status = 'played' WHERE queue_id = v_cur_id;
    END IF;

    CALL sp_fill_queue(p_stage);

    SELECT queue_id INTO v_next
      FROM live_queue
     WHERE stage_id = p_stage AND status = 'queued'
     ORDER BY play_order
     LIMIT 1;

    IF v_next IS NOT NULL THEN
        UPDATE live_queue SET status = 'playing', started_at = clock_timestamp()
         WHERE queue_id = v_next;
    END IF;

    CALL sp_fill_queue(p_stage);
END;
$$;

-- ---------------------------------------------------------------------
-- The pivot: drop the unplayed queue, switch vibe, refill, cut to the
-- first new track and write the decision to the audit log.
-- p_forced = NULL lets the autopilot choose the neighbour.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_rewrite_queue(p_stage INT, p_reason TEXT, p_score INT, p_forced INT DEFAULT NULL)
LANGUAGE plpgsql
AS $$
DECLARE
    v_old INT;
    v_new INT;
BEGIN
    SELECT current_cluster_id INTO v_old FROM stages WHERE stage_id = p_stage FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', p_stage USING ERRCODE = 'FS404';
    END IF;

    v_new := COALESCE(p_forced, fn_pick_adjacent_cluster(v_old));

    IF v_new IS NULL THEN
        UPDATE stages SET current_vibe_score = 0, last_pivot_at = clock_timestamp()
         WHERE stage_id = p_stage;
        INSERT INTO vibe_shift_log (stage_id, old_cluster_id, new_cluster_id, trigger_score, reason)
        VALUES (p_stage, v_old, NULL, p_score, 'no_neighbor');
        RETURN;
    END IF;

    DELETE FROM live_queue WHERE stage_id = p_stage AND status = 'queued';

    UPDATE stages
       SET current_cluster_id = v_new,
           current_vibe_score = 0,
           last_pivot_at      = clock_timestamp()
     WHERE stage_id = p_stage;

    CALL sp_fill_queue(p_stage);
    CALL sp_advance_queue(p_stage, NULL, TRUE);

    INSERT INTO vibe_shift_log (stage_id, old_cluster_id, new_cluster_id, trigger_score, reason)
    VALUES (p_stage, v_old, v_new, p_score, p_reason);
END;
$$;

-- ---------------------------------------------------------------------
-- BEFORE INSERT on live_votes.
-- Growing phase of strict 2PL: take an exclusive lock on the stage row.
-- It is held until COMMIT/ROLLBACK (shrinking phase), so concurrent
-- votes for the same stage are serialised and no update is lost.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_vote_before()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_track INT;
BEGIN
    PERFORM 1 FROM stages WHERE stage_id = NEW.stage_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', NEW.stage_id USING ERRCODE = 'FS404';
    END IF;

    -- Rate limit, enforced under the lock so two taps cannot race past it.
    IF EXISTS (SELECT 1 FROM live_votes
                WHERE session_id = NEW.session_id
                  AND stage_id   = NEW.stage_id
                  AND vote_time  > clock_timestamp() - INTERVAL '3 seconds') THEN
        RAISE EXCEPTION 'One vote every 3 seconds per phone' USING ERRCODE = 'FS429';
    END IF;

    -- A vote is always about whatever is playing right now.
    SELECT track_id INTO v_track
      FROM live_queue WHERE stage_id = NEW.stage_id AND status = 'playing';
    IF v_track IS NULL THEN
        RAISE EXCEPTION 'Nothing is playing on stage %', NEW.stage_id USING ERRCODE = 'FS409';
    END IF;

    NEW.track_id  := v_track;
    NEW.vote_time := clock_timestamp();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- AFTER INSERT on live_votes: the tripwire.
-- Score = sum of votes in the sliding window, counted only since the
-- last pivot, so one pivot does not immediately cause another.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_vibe_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stage stages%ROWTYPE;
    v_score INT;
BEGIN
    SELECT * INTO v_stage FROM stages WHERE stage_id = NEW.stage_id;  -- already locked by fn_vote_before

    SELECT COALESCE(SUM(vote_val), 0) INTO v_score
      FROM live_votes
     WHERE stage_id  = NEW.stage_id
       AND vote_time > GREATEST(clock_timestamp() - make_interval(secs => v_stage.window_seconds),
                                v_stage.last_pivot_at);

    UPDATE stages
       SET current_vibe_score = v_score,
           total_votes        = total_votes + 1
     WHERE stage_id = NEW.stage_id;

    IF NOT v_stage.manual_override
       AND v_score <= v_stage.threshold
       AND clock_timestamp() >= v_stage.last_pivot_at + make_interval(secs => v_stage.cooldown_seconds)
    THEN
        BEGIN
            CALL sp_rewrite_queue(NEW.stage_id, 'autopilot', v_score, NULL);
        EXCEPTION WHEN OTHERS THEN
            -- A failed pivot must never lose the vote itself.
            RAISE WARNING 'Pivot failed on stage %: %', NEW.stage_id, SQLERRM;
        END;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_vote_validate
BEFORE INSERT ON live_votes
FOR EACH ROW EXECUTE FUNCTION fn_vote_before();

CREATE TRIGGER trg_check_vibe_score
AFTER INSERT ON live_votes
FOR EACH ROW EXECUTE FUNCTION fn_check_vibe_score();

-- ---------------------------------------------------------------------
-- Admin controls.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_set_override(p_stage INT, p_on BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cluster INT;
    v_score   INT;
BEGIN
    UPDATE stages SET manual_override = p_on
     WHERE stage_id = p_stage
    RETURNING current_cluster_id, current_vibe_score INTO v_cluster, v_score;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', p_stage USING ERRCODE = 'FS404';
    END IF;

    INSERT INTO vibe_shift_log (stage_id, old_cluster_id, new_cluster_id, trigger_score, reason)
    VALUES (p_stage, v_cluster, v_cluster, v_score,
            CASE WHEN p_on THEN 'override_on' ELSE 'override_off' END);
END;
$$;

CREATE OR REPLACE PROCEDURE sp_force_vibe(p_stage INT, p_cluster INT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_score INT;
BEGIN
    SELECT current_vibe_score INTO v_score FROM stages WHERE stage_id = p_stage;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', p_stage USING ERRCODE = 'FS404';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM vibe_clusters WHERE cluster_id = p_cluster) THEN
        RAISE EXCEPTION 'Vibe % does not exist', p_cluster USING ERRCODE = 'FS404';
    END IF;
    CALL sp_rewrite_queue(p_stage, 'manual', v_score, p_cluster);
END;
$$;

-- ---------------------------------------------------------------------
-- Read-only views the API exposes as-is.
-- ---------------------------------------------------------------------
CREATE VIEW v_stage_stats AS
SELECT s.stage_id,
       s.stage_name,
       s.current_cluster_id,
       c.vibe_name,
       c.energy_level,
       (SELECT COALESCE(SUM(v.vote_val), 0)::INT
          FROM live_votes v
         WHERE v.stage_id  = s.stage_id
           AND v.vote_time > GREATEST(now() - make_interval(secs => s.window_seconds), s.last_pivot_at)
       ) AS live_score,
       s.current_vibe_score,
       s.threshold,
       s.window_seconds,
       s.manual_override,
       s.total_votes,
       (SELECT count(*) FROM live_votes v WHERE v.stage_id = s.stage_id) AS vote_rows,
       (SELECT count(*) FROM live_votes v
         WHERE v.stage_id = s.stage_id AND v.vote_time > now() - INTERVAL '1 minute') AS votes_last_minute,
       s.last_pivot_at
  FROM stages s
  JOIN vibe_clusters c ON c.cluster_id = s.current_cluster_id;

CREATE VIEW v_now_playing AS
SELECT q.stage_id,
       q.queue_id,
       t.track_id,
       t.title,
       t.artist_name,
       t.tempo,
       t.audio_url,
       c.vibe_name,
       c.energy_level,
       LEAST(CEIL(t.duration_ms / 1000.0)::INT, s.play_seconds)                  AS play_seconds,
       EXTRACT(EPOCH FROM (clock_timestamp() - q.started_at))::NUMERIC(8,2)       AS elapsed_seconds
  FROM live_queue q
  JOIN tracks t        ON t.track_id   = q.track_id
  JOIN vibe_clusters c ON c.cluster_id = t.cluster_id
  JOIN stages s        ON s.stage_id   = q.stage_id
 WHERE q.status = 'playing';

CREATE VIEW v_upcoming AS
SELECT q.stage_id,
       q.queue_id,
       q.play_order,
       t.title,
       t.artist_name,
       c.vibe_name
  FROM live_queue q
  JOIN tracks t        ON t.track_id   = q.track_id
  JOIN vibe_clusters c ON c.cluster_id = t.cluster_id
 WHERE q.status = 'queued';

CREATE VIEW v_shift_log AS
SELECT l.log_id,
       l.stage_id,
       l.created_at,
       l.reason,
       l.trigger_score,
       o.vibe_name AS old_vibe,
       n.vibe_name AS new_vibe
  FROM vibe_shift_log l
  LEFT JOIN vibe_clusters o ON o.cluster_id = l.old_cluster_id
  LEFT JOIN vibe_clusters n ON n.cluster_id = l.new_cluster_id;
