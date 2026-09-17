-- ============================================================
-- FUNCTION: pivot_vibe(stage_id)
-- Rewrites Live_Queue for the given stage by:
--   1. Finding the cluster of the currently playing track
--   2. Picking the highest-energy adjacent cluster
--   3. DELETEing pending queue rows, INSERTing a fresh order
--   4. Resetting curr_vibe_score to a neutral baseline
-- ============================================================
CREATE OR REPLACE FUNCTION pivot_vibe(p_stage_id SMALLINT)
RETURNS VOID AS $$
DECLARE
    v_current_cluster   SMALLINT;
    v_target_cluster    SMALLINT;
    v_next_order        SMALLINT := 0;
    v_track             RECORD;
BEGIN
    -- Find the cluster of whatever is currently "now playing" (status = 1)
    SELECT t.cluster_id INTO v_current_cluster
    FROM Live_Queue lq
    JOIN Tracks t ON t.track_id = lq.track_id
    WHERE lq.stage_id = p_stage_id AND lq.status = 1
    LIMIT 1;

    IF v_current_cluster IS NULL THEN
        -- No "now playing" row found — nothing to pivot from, exit safely
        RETURN;
    END IF;

    -- Pick the most energetic adjacent cluster (precomputed offline)
    SELECT adjacent_cluster_id INTO v_target_cluster
    FROM Cluster_Adjacency
    WHERE cluster_id = v_current_cluster
    ORDER BY energy_delta DESC
    LIMIT 1;

    IF v_target_cluster IS NULL THEN
        RETURN; -- no known adjacency; nothing safe to pivot to
    END IF;

    -- Wipe pending (not-yet-played) queue rows for this stage
    DELETE FROM Live_Queue
    WHERE stage_id = p_stage_id AND status = 0;

    -- Rebuild the queue from the target cluster (simple example:
    -- take up to 10 tracks; swap for weighted/random selection as needed)
    FOR v_track IN
        SELECT track_id FROM Tracks
        WHERE cluster_id = v_target_cluster
        ORDER BY random()
        LIMIT 10
    LOOP
        INSERT INTO Live_Queue (stage_id, track_id, play_order, status)
        VALUES (p_stage_id, v_track.track_id, v_next_order, 0);
        v_next_order := v_next_order + 1;
    END LOOP;

    -- Reset score to neutral baseline after a pivot
    UPDATE Stages SET curr_vibe_score = 0 WHERE stage_id = p_stage_id;
END;
$$ LANGUAGE plpgsql;
