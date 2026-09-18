CREATE OR REPLACE FUNCTION sp_rewrite_queue(p_stage_id INT) RETURNS VOID AS $$
DECLARE
    v_current_cluster INT;
    v_new_cluster INT;
BEGIN
    -- Get the cluster of the currently playing song (if any)
    SELECT t.cluster_id INTO v_current_cluster
    FROM Live_Queue q
    JOIN Tracks t ON q.track_id = t.track_id
    WHERE q.stage_id = p_stage_id AND q.status = 'PLAYING'
    LIMIT 1;

    -- Pick a new cluster different from the current one
    SELECT cluster_id INTO v_new_cluster
    FROM Vibe_Clusters
    WHERE cluster_id != COALESCE(v_current_cluster, -1)
    ORDER BY RANDOM()
    LIMIT 1;

    -- If no other cluster found, just pick any
    IF v_new_cluster IS NULL THEN
        SELECT cluster_id INTO v_new_cluster FROM Vibe_Clusters ORDER BY RANDOM() LIMIT 1;
    END IF;

    -- Delete all upcoming queued tracks
    DELETE FROM Live_Queue
    WHERE stage_id = p_stage_id AND status = 'QUEUED';

    -- Insert 5 random tracks from the new cluster
    INSERT INTO Live_Queue (stage_id, track_id, play_order)
    SELECT p_stage_id, track_id, row_number() over (order by random())
    FROM Tracks
    WHERE cluster_id = v_new_cluster
    ORDER BY RANDOM()
    LIMIT 5;

    -- Reset the stage score to give the new vibe a chance
    UPDATE Stages SET current_vibe_score = 0 WHERE stage_id = p_stage_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trg_check_vibe_score_func() RETURNS TRIGGER AS $$
DECLARE
    v_score INT;
    v_override BOOLEAN;
BEGIN
    -- Update the score using row-level locking natively in Postgres (2PL)
    UPDATE Stages 
    SET current_vibe_score = current_vibe_score + NEW.vote_value 
    WHERE stage_id = NEW.stage_id
    RETURNING current_vibe_score, manual_override INTO v_score, v_override;

    -- If the vibe is terrible (score drops below -5) and autopilot is ON
    IF v_score < -5 AND v_override = FALSE THEN
        PERFORM sp_rewrite_queue(NEW.stage_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_vibe_score
AFTER INSERT ON Live_Votes
FOR EACH ROW
EXECUTE FUNCTION trg_check_vibe_score_func();
