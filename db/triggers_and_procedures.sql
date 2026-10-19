-- =====================================================================
-- The Crowdsourced Festival Stage Optimizer : Triggers, Procedures & Debugger
-- 100% in PostgreSQL, No Extensions.
-- Features: Strict 2PL, ECA Tripwire, Lineage Provenance, Replay & What-If.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Step 2: Deterministic seeded cluster adjacency hop.
-- Uses hashtext(seed || candidate_id) for reproducible tie-breaking.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_pick_adjacent_cluster(p_current INT, p_seed TEXT DEFAULT NULL)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_result INT;
    v_seed   TEXT;
BEGIN
    v_seed := COALESCE(p_seed, 'seed_' || clock_timestamp()::TEXT);

    SELECT ca.to_cluster
      INTO v_result
      FROM cluster_adjacency ca
      JOIN vibe_clusters f ON f.cluster_id = ca.from_cluster
      JOIN vibe_clusters t ON t.cluster_id = ca.to_cluster
     WHERE ca.from_cluster = p_current
     ORDER BY (t.energy_level > f.energy_level) DESC,
              abs(t.energy_level - f.energy_level),
              hashtext(v_seed || '_' || ca.to_cluster::TEXT)
     LIMIT 1;

    RETURN v_result;  -- NULL when the cluster has no neighbours
END;
$$;

-- ---------------------------------------------------------------------
-- Step 2: Keep p_target upcoming tracks in the queue, drawn from the
-- current vibe using a deterministic seeded pick (hashtext) and explicit cursor.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_fill_queue(p_stage INT, p_target INT DEFAULT 5, p_seed TEXT DEFAULT NULL)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cluster  INT;
    v_missing  INT;
    v_order    INT;
    v_track    INT;
    v_seed     TEXT;
    cur_tracks CURSOR (c INT, n INT, s TEXT) FOR
        SELECT t.track_id
          FROM tracks t
         WHERE t.cluster_id = c
           AND NOT EXISTS (SELECT 1 FROM live_queue q
                            WHERE q.stage_id = p_stage
                              AND q.track_id = t.track_id
                              AND q.status  <> 'played')
         ORDER BY hashtext(s || '_' || t.track_id::TEXT)
         LIMIT n;
BEGIN
    v_seed := COALESCE(p_seed, 'fill_' || clock_timestamp()::TEXT);

    SELECT current_cluster_id INTO v_cluster FROM stages WHERE stage_id = p_stage;

    SELECT p_target - count(*) INTO v_missing
      FROM live_queue WHERE stage_id = p_stage AND status = 'queued';
    IF v_missing <= 0 THEN
        RETURN;
    END IF;

    SELECT COALESCE(max(play_order), 0) INTO v_order
      FROM live_queue WHERE stage_id = p_stage;

    OPEN cur_tracks(v_cluster, v_missing, v_seed);
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
-- Move a stage to its next track. Idempotent queue advance.
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
-- Step 1: Pure Evaluation Function
-- Reads live_votes and returns the score, whether it would fire, and
-- which condition blocked it if not.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_evaluate(
    p_stage_id            INT,
    p_as_of_ts            TIMESTAMPTZ,
    p_threshold           INT,
    p_window_s            INT,
    p_cooldown_s          INT,
    p_override_last_pivot TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    score           INT,
    would_fire      BOOLEAN,
    blocked_by      TEXT,
    window_start    TIMESTAMPTZ,
    window_end      TIMESTAMPTZ,
    votes_in_window INT,
    last_pivot_at   TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stage_override BOOLEAN;
    v_last_pivot     TIMESTAMPTZ;
    v_win_start      TIMESTAMPTZ;
    v_win_end        TIMESTAMPTZ := p_as_of_ts;
    v_score          INT;
    v_count          INT;
    v_blocked        TEXT := NULL;
    v_fire           BOOLEAN := FALSE;
BEGIN
    -- Read override status
    SELECT manual_override INTO v_stage_override
      FROM stages WHERE stage_id = p_stage_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', p_stage_id USING ERRCODE = 'FS404';
    END IF;

    -- Find most recent pivot before as_of_ts, or use simulated override if provided
    IF p_override_last_pivot IS NOT NULL THEN
        v_last_pivot := p_override_last_pivot;
    ELSE
        SELECT COALESCE(
                 (SELECT MAX(created_at) FROM pivot_lineage WHERE stage_id = p_stage_id AND created_at < p_as_of_ts),
                 (SELECT MAX(created_at) FROM vibe_shift_log WHERE stage_id = p_stage_id AND created_at < p_as_of_ts),
                 (SELECT s.last_pivot_at FROM stages s WHERE s.stage_id = p_stage_id AND s.last_pivot_at < p_as_of_ts),
                 '1970-01-01 00:00:00+00'::TIMESTAMPTZ
               ) INTO v_last_pivot;
    END IF;

    v_win_start := GREATEST(p_as_of_ts - make_interval(secs => p_window_s), v_last_pivot);

    -- Calculate sliding window sum and count
    SELECT COALESCE(SUM(v.vote_val), 0)::INT, COUNT(*)::INT
      INTO v_score, v_count
      FROM live_votes v
     WHERE v.stage_id  = p_stage_id
       AND v.vote_time > v_win_start
       AND v.vote_time <= v_win_end;

    -- Evaluate conditions
    IF v_stage_override THEN
        v_blocked := 'manual_override';
    ELSIF p_as_of_ts < v_last_pivot + make_interval(secs => p_cooldown_s) THEN
        v_blocked := 'cooldown_active';
    ELSIF v_score > p_threshold THEN
        v_blocked := 'threshold_not_reached';
    ELSE
        v_fire := TRUE;
        v_blocked := NULL;
    END IF;

    RETURN QUERY SELECT v_score, v_fire, v_blocked, v_win_start, v_win_end, v_count, v_last_pivot;
END;
$$;

-- ---------------------------------------------------------------------
-- Step 2: The pivot: drops unplayed queue, switches vibe deterministically,
-- refills queue, cuts to first track, and logs provenance into pivot_lineage.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_rewrite_queue(
    p_stage   INT,
    p_reason  TEXT,
    p_score   INT,
    p_forced  INT DEFAULT NULL,
    p_seed_in TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stage               stages%ROWTYPE;
    v_old                 INT;
    v_new                 INT;
    v_now                 TIMESTAMPTZ := clock_timestamp();
    v_seed                TEXT;
    v_candidates          JSONB := '[]'::jsonb;
    v_tracks_chosen       JSONB := '[]'::jsonb;
    v_win_start           TIMESTAMPTZ;
    v_pivot_id            BIGINT;
BEGIN
    SELECT * INTO v_stage FROM stages WHERE stage_id = p_stage FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', p_stage USING ERRCODE = 'FS404';
    END IF;

    v_old := v_stage.current_cluster_id;
    v_seed := COALESCE(p_seed_in, 'pvt_' || p_stage || '_' || to_char(v_now, 'YYYYMMDD_HH24MISS_US') || '_' || floor(random() * 100000)::TEXT);
    v_win_start := GREATEST(v_now - make_interval(secs => v_stage.window_seconds), v_stage.last_pivot_at);

    -- Capture candidate breakdown for provenance
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'cluster_id', ca.to_cluster,
               'vibe_name', t.vibe_name,
               'energy_level', t.energy_level,
               'energy_diff', abs(t.energy_level - f.energy_level),
               'is_higher_energy', (t.energy_level > f.energy_level),
               'hash_rank', hashtext(v_seed || '_' || ca.to_cluster::TEXT)
           ) ORDER BY (t.energy_level > f.energy_level) DESC,
                      abs(t.energy_level - f.energy_level),
                      hashtext(v_seed || '_' || ca.to_cluster::TEXT)), '[]'::jsonb)
      INTO v_candidates
      FROM cluster_adjacency ca
      JOIN vibe_clusters f ON f.cluster_id = ca.from_cluster
      JOIN vibe_clusters t ON t.cluster_id = ca.to_cluster
     WHERE ca.from_cluster = v_old;

    v_new := COALESCE(p_forced, fn_pick_adjacent_cluster(v_old, v_seed));

    IF v_new IS NULL THEN
        UPDATE stages SET current_vibe_score = 0, last_pivot_at = v_now
         WHERE stage_id = p_stage;
        INSERT INTO vibe_shift_log (stage_id, old_cluster_id, new_cluster_id, trigger_score, reason, created_at)
        VALUES (p_stage, v_old, NULL, p_score, 'no_neighbor', v_now);
        RETURN;
    END IF;

    DELETE FROM live_queue WHERE stage_id = p_stage AND status = 'queued';

    UPDATE stages
       SET current_cluster_id = v_new,
           current_vibe_score = 0,
           last_pivot_at      = v_now
     WHERE stage_id = p_stage;

    CALL sp_fill_queue(p_stage, 5, v_seed);

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'queue_id', q.queue_id,
               'track_id', t.track_id,
               'title', t.title,
               'artist_name', t.artist_name,
               'play_order', q.play_order
           ) ORDER BY q.play_order), '[]'::jsonb)
      INTO v_tracks_chosen
      FROM live_queue q
      JOIN tracks t ON t.track_id = q.track_id
     WHERE q.stage_id = p_stage AND q.status = 'queued';

    CALL sp_advance_queue(p_stage, NULL, TRUE);

    -- Insert into pivot_lineage
    INSERT INTO pivot_lineage (
        stage_id, seed, window_start, window_end, threshold, score,
        old_cluster_id, new_cluster_id, candidates_considered, tracks_chosen, reason, created_at
    ) VALUES (
        p_stage, v_seed, v_win_start, v_now, v_stage.threshold, p_score,
        v_old, v_new, v_candidates, v_tracks_chosen, p_reason, v_now
    ) RETURNING pivot_id INTO v_pivot_id;

    -- Backward compatibility audit log
    INSERT INTO vibe_shift_log (stage_id, old_cluster_id, new_cluster_id, trigger_score, reason, created_at)
    VALUES (p_stage, v_old, v_new, p_score, p_reason, v_now);
END;
$$;

-- ---------------------------------------------------------------------
-- BEFORE INSERT on live_votes: Strict 2PL Growing Phase.
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

    IF EXISTS (SELECT 1 FROM live_votes
                WHERE session_id = NEW.session_id
                  AND stage_id   = NEW.stage_id
                  AND vote_time  > clock_timestamp() - INTERVAL '3 seconds') THEN
        RAISE EXCEPTION 'One vote every 3 seconds per phone' USING ERRCODE = 'FS429';
    END IF;

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
-- Step 1: AFTER INSERT on live_votes: Calls fn_evaluate directly.
-- Single code path between production tripwire and replay.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_vibe_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stage stages%ROWTYPE;
    v_eval  RECORD;
BEGIN
    SELECT * INTO v_stage FROM stages WHERE stage_id = NEW.stage_id;  -- locked by fn_vote_before

    SELECT * INTO v_eval
      FROM fn_evaluate(NEW.stage_id, clock_timestamp(), v_stage.threshold, v_stage.window_seconds, v_stage.cooldown_seconds);

    UPDATE stages
       SET current_vibe_score = v_eval.score,
           total_votes        = total_votes + 1
     WHERE stage_id = NEW.stage_id;

    IF v_eval.would_fire THEN
        BEGIN
            CALL sp_rewrite_queue(NEW.stage_id, 'autopilot', v_eval.score, NULL, NULL);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Pivot failed on stage %: %', NEW.stage_id, SQLERRM;
        END;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_vote_validate ON live_votes;
CREATE TRIGGER trg_vote_validate
BEFORE INSERT ON live_votes
FOR EACH ROW EXECUTE FUNCTION fn_vote_before();

DROP TRIGGER IF EXISTS trg_check_vibe_score ON live_votes;
CREATE TRIGGER trg_check_vibe_score
AFTER INSERT ON live_votes
FOR EACH ROW EXECUTE FUNCTION fn_check_vibe_score();

-- ---------------------------------------------------------------------
-- Admin manual controls
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
    CALL sp_rewrite_queue(p_stage, 'manual', v_score, p_cluster, NULL);
END;
$$;

-- =====================================================================
-- Step 3: THE FOUR PIVOT DEBUGGER FUNCTIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- Feature 1: Why? (sp_explain_pivot)
-- Returns the votes, score, condition checklist, candidates and chosen tracks.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_explain_pivot(p_pivot_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_lin RECORD;
    v_votes JSONB;
    v_upvotes INT;
    v_downvotes INT;
    v_old_vibe TEXT;
    v_new_vibe TEXT;
    v_result JSONB;
BEGIN
    SELECT * INTO v_lin FROM pivot_lineage WHERE pivot_id = p_pivot_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pivot % not found in lineage', p_pivot_id USING ERRCODE = 'FS404';
    END IF;

    SELECT vibe_name INTO v_old_vibe FROM vibe_clusters WHERE cluster_id = v_lin.old_cluster_id;
    SELECT vibe_name INTO v_new_vibe FROM vibe_clusters WHERE cluster_id = v_lin.new_cluster_id;

    -- Recover votes in the sliding window directly from timestamps
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'vote_id', v.vote_id,
               'session_id', v.session_id,
               'vote_val', v.vote_val,
               'vote_time', v.vote_time,
               'track_id', v.track_id,
               'title', t.title
           ) ORDER BY v.vote_time ASC), '[]'::jsonb),
           COUNT(*) FILTER (WHERE v.vote_val = 1)::INT,
           COUNT(*) FILTER (WHERE v.vote_val = -1)::INT
      INTO v_votes, v_upvotes, v_downvotes
      FROM live_votes v
      LEFT JOIN tracks t ON t.track_id = v.track_id
     WHERE v.stage_id = v_lin.stage_id
       AND v.vote_time > v_lin.window_start
       AND v.vote_time <= v_lin.window_end;

    v_result := jsonb_build_object(
        'pivot_id', v_lin.pivot_id,
        'stage_id', v_lin.stage_id,
        'seed', v_lin.seed,
        'created_at', v_lin.created_at,
        'reason', v_lin.reason,
        'window_start', v_lin.window_start,
        'window_end', v_lin.window_end,
        'score', v_lin.score,
        'threshold', v_lin.threshold,
        'old_cluster', jsonb_build_object('id', v_lin.old_cluster_id, 'name', v_old_vibe),
        'new_cluster', jsonb_build_object('id', v_lin.new_cluster_id, 'name', v_new_vibe),
        'conditions_passed', jsonb_build_object(
            'threshold_breached', (v_lin.score <= v_lin.threshold),
            'cooldown_elapsed', TRUE,
            'manual_override_disabled', TRUE
        ),
        'vote_stats', jsonb_build_object(
            'total_votes', jsonb_array_length(v_votes),
            'upvotes', v_upvotes,
            'downvotes', v_downvotes,
            'net_score', v_lin.score
        ),
        'candidates_considered', v_lin.candidates_considered,
        'tracks_chosen', v_lin.tracks_chosen,
        'votes_in_window', v_votes
    );

    RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------
-- Feature 2: Why-Not? (sp_explain_at)
-- Returns what blocked firing at any specified moment in time.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_explain_at(p_stage_id INT, p_ts TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_stage       stages%ROWTYPE;
    v_eval        RECORD;
    v_explanation TEXT;
    v_deficit     INT;
    v_secs_left   INT;
BEGIN
    SELECT * INTO v_stage FROM stages WHERE stage_id = p_stage_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stage % does not exist', p_stage_id USING ERRCODE = 'FS404';
    END IF;

    SELECT * INTO v_eval
      FROM fn_evaluate(p_stage_id, p_ts, v_stage.threshold, v_stage.window_seconds, v_stage.cooldown_seconds);

    IF v_eval.blocked_by = 'manual_override' THEN
        v_explanation := 'Manual override is ON. Autopilot is paused by the stage manager.';
    ELSIF v_eval.blocked_by = 'cooldown_active' THEN
        v_secs_left := CEIL(EXTRACT(EPOCH FROM ((v_eval.last_pivot_at + make_interval(secs => v_stage.cooldown_seconds)) - p_ts)))::INT;
        v_explanation := format('Cooldown active: %s seconds remaining before next pivot permitted.', GREATEST(v_secs_left, 1));
    ELSIF v_eval.blocked_by = 'threshold_not_reached' THEN
        v_deficit := (v_eval.score - v_stage.threshold);
        v_explanation := format('Threshold not reached: Vibe score is %s (threshold %s). Required %s more downvotes in the %s-second window.',
                                v_eval.score, v_stage.threshold, v_deficit, v_stage.window_seconds);
    ELSE
        v_explanation := 'Conditions satisfied: Autopilot would have tripped a pivot at this timestamp.';
    END IF;

    RETURN jsonb_build_object(
        'stage_id', p_stage_id,
        'as_of_ts', p_ts,
        'score', v_eval.score,
        'threshold', v_stage.threshold,
        'would_fire', v_eval.would_fire,
        'blocked_by', v_eval.blocked_by,
        'explanation', v_explanation,
        'window_start', v_eval.window_start,
        'window_end', v_eval.window_end,
        'votes_in_window', v_eval.votes_in_window,
        'last_pivot_at', v_eval.last_pivot_at
    );
END;
$$;

-- ---------------------------------------------------------------------
-- Feature 3: Replay (sp_replay_pivot)
-- Re-runs the pivot from the seed and verifies that results match.
-- Takes the stage row lock first.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_replay_pivot(p_pivot_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_lin RECORD;
    v_replayed_cluster INT;
    v_start_time TIMESTAMPTZ := clock_timestamp();
    v_cluster_match BOOLEAN;
    v_exec_time NUMERIC;
    v_old_name TEXT;
    v_expected_name TEXT;
    v_replayed_name TEXT;
BEGIN
    SELECT * INTO v_lin FROM pivot_lineage WHERE pivot_id = p_pivot_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pivot % not found in lineage', p_pivot_id USING ERRCODE = 'FS404';
    END IF;

    -- Take stage lock first as specified
    PERFORM 1 FROM stages WHERE stage_id = v_lin.stage_id FOR UPDATE;

    -- Re-run deterministic cluster selection using the exact recorded seed
    v_replayed_cluster := fn_pick_adjacent_cluster(v_lin.old_cluster_id, v_lin.seed);
    v_cluster_match := (v_replayed_cluster = v_lin.new_cluster_id);
    v_exec_time := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000.0;

    SELECT vibe_name INTO v_old_name FROM vibe_clusters WHERE cluster_id = v_lin.old_cluster_id;
    SELECT vibe_name INTO v_expected_name FROM vibe_clusters WHERE cluster_id = v_lin.new_cluster_id;
    SELECT vibe_name INTO v_replayed_name FROM vibe_clusters WHERE cluster_id = v_replayed_cluster;

    RETURN jsonb_build_object(
        'pivot_id', p_pivot_id,
        'stage_id', v_lin.stage_id,
        'seed', v_lin.seed,
        'reproduced', v_cluster_match,
        'old_cluster', jsonb_build_object('id', v_lin.old_cluster_id, 'name', v_old_name),
        'expected_cluster', jsonb_build_object('id', v_lin.new_cluster_id, 'name', v_expected_name),
        'replayed_cluster', jsonb_build_object('id', v_replayed_cluster, 'name', v_replayed_name),
        'execution_time_ms', round(v_exec_time, 3),
        'timestamp', v_lin.created_at
    );
END;
$$;

-- ---------------------------------------------------------------------
-- Feature 4: What-If (fn_whatif & sp_whatif)
-- Walks the recorded votes with fn_evaluate, returning simulated pivots.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_whatif(
    p_stage_id   INT,
    p_from_ts    TIMESTAMPTZ,
    p_to_ts      TIMESTAMPTZ,
    p_threshold  INT,
    p_window_s   INT,
    p_cooldown_s INT
)
RETURNS TABLE (
    simulated_pivot_id       INT,
    simulated_at             TIMESTAMPTZ,
    trigger_score            INT,
    threshold                INT,
    old_cluster_id           INT,
    old_vibe_name            VARCHAR(30),
    new_cluster_id           INT,
    new_vibe_name            VARCHAR(30),
    votes_in_window          INT,
    time_since_last_pivot_s  NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_virtual_last_pivot TIMESTAMPTZ := p_from_ts;
    v_virtual_cluster    INT;
    v_vote_rec           RECORD;
    v_win_start          TIMESTAMPTZ;
    v_score              INT;
    v_count              INT;
    v_new_cluster        INT;
    v_pivot_num          INT := 0;
    v_old_name           VARCHAR(30);
    v_new_name           VARCHAR(30);
    v_time_diff          NUMERIC;
    v_eval               RECORD;
BEGIN
    SELECT current_cluster_id INTO v_virtual_cluster FROM stages WHERE stage_id = p_stage_id;
    IF v_virtual_cluster IS NULL THEN
        SELECT cluster_id INTO v_virtual_cluster FROM vibe_clusters ORDER BY cluster_id LIMIT 1;
    END IF;

    FOR v_vote_rec IN 
        SELECT vote_time
          FROM live_votes
         WHERE stage_id = p_stage_id
           AND vote_time >= p_from_ts
           AND vote_time <= p_to_ts
         GROUP BY vote_time
         ORDER BY vote_time ASC
    LOOP
        -- Walk recorded votes with pure fn_evaluate
        SELECT * INTO v_eval
          FROM fn_evaluate(p_stage_id, v_vote_rec.vote_time, p_threshold, p_window_s, p_cooldown_s, v_virtual_last_pivot);

        IF v_eval.would_fire THEN
            v_pivot_num := v_pivot_num + 1;
            v_time_diff := ROUND(EXTRACT(EPOCH FROM (v_vote_rec.vote_time - v_virtual_last_pivot))::NUMERIC, 1);

            v_new_cluster := fn_pick_adjacent_cluster(v_virtual_cluster, 'whatif_' || v_pivot_num || '_' || v_vote_rec.vote_time::TEXT);
            IF v_new_cluster IS NULL THEN
                v_new_cluster := v_virtual_cluster;
            END IF;

            SELECT vibe_name INTO v_old_name FROM vibe_clusters WHERE cluster_id = v_virtual_cluster;
            SELECT vibe_name INTO v_new_name FROM vibe_clusters WHERE cluster_id = v_new_cluster;

            simulated_pivot_id      := v_pivot_num;
            simulated_at            := v_vote_rec.vote_time;
            trigger_score           := v_eval.score;
            threshold               := p_threshold;
            old_cluster_id          := v_virtual_cluster;
            old_vibe_name           := v_old_name;
            new_cluster_id          := v_new_cluster;
            new_vibe_name           := v_new_name;
            votes_in_window         := v_eval.votes_in_window;
            time_since_last_pivot_s := v_time_diff;

            RETURN NEXT;

            v_virtual_last_pivot := v_vote_rec.vote_time;
            v_virtual_cluster    := v_new_cluster;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_whatif(
    p_stage_id   INT,
    p_from_ts    TIMESTAMPTZ,
    p_to_ts      TIMESTAMPTZ,
    p_threshold  INT,
    p_window_s   INT,
    p_cooldown_s INT,
    INOUT p_result JSONB DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT COALESCE(jsonb_agg(to_jsonb(w)), '[]'::jsonb)
      INTO p_result
      FROM fn_whatif(p_stage_id, p_from_ts, p_to_ts, p_threshold, p_window_s, p_cooldown_s) w;

    -- Explicit ROLLBACK to guarantee pure what-if simulation with zero side effects
    ROLLBACK;
END;
$$;

-- ---------------------------------------------------------------------
-- Read-Only Reporting Views
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_stage_stats AS
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
       s.cooldown_seconds,
       s.manual_override,
       s.total_votes,
       (SELECT count(*) FROM live_votes v WHERE v.stage_id = s.stage_id) AS vote_rows,
       (SELECT count(*) FROM live_votes v
         WHERE v.stage_id = s.stage_id AND v.vote_time > now() - INTERVAL '1 minute') AS votes_last_minute,
       s.last_pivot_at
  FROM stages s
  JOIN vibe_clusters c ON c.cluster_id = s.current_cluster_id;

CREATE OR REPLACE VIEW v_now_playing AS
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

CREATE OR REPLACE VIEW v_upcoming AS
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

CREATE OR REPLACE VIEW v_shift_log AS
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

CREATE OR REPLACE VIEW v_pivot_debugger_timeline AS
SELECT l.pivot_id,
       l.stage_id,
       l.seed,
       l.created_at AS pivot_time,
       l.score,
       l.threshold,
       l.reason,
       o.vibe_name AS old_vibe,
       n.vibe_name AS new_vibe,
       l.window_start,
       l.window_end,
       jsonb_array_length(l.tracks_chosen) AS tracks_queued_count
  FROM pivot_lineage l
  LEFT JOIN vibe_clusters o ON o.cluster_id = l.old_cluster_id
  LEFT JOIN vibe_clusters n ON n.cluster_id = l.new_cluster_id
 ORDER BY l.created_at DESC;
