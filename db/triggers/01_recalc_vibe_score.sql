-- ============================================================
-- FUNCTION: recalc_vibe_score() — trigger function
-- Fires AFTER INSERT on Live_Votes. This is the "tripwire."
--
-- Concurrency: locks only the single Stages row for this
-- stage_id via SELECT ... FOR UPDATE (Two-Phase Locking,
-- growing phase). Lock is released automatically at COMMIT
-- (shrinking phase). Because the lock is per-stage, votes on
-- different stages never block each other.
-- ============================================================
CREATE OR REPLACE FUNCTION recalc_vibe_score()
RETURNS TRIGGER AS $$
DECLARE
    v_new_score SMALLINT;
BEGIN
    -- Phase 1 (growing): acquire an exclusive lock on this stage's row
    SELECT curr_vibe_score INTO v_new_score
    FROM Stages
    WHERE stage_id = NEW.stage_id
    FOR UPDATE;

    -- Apply this vote's delta
    v_new_score := v_new_score + NEW.vote_val;

    UPDATE Stages
    SET curr_vibe_score = v_new_score
    WHERE stage_id = NEW.stage_id;

    -- Threshold check: below -50 triggers an autonomous pivot
    IF v_new_score < -50 THEN
        PERFORM pivot_vibe(NEW.stage_id);
    END IF;

    RETURN NEW;
    -- Phase 2 (shrinking): lock is released when this transaction commits
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- TRIGGER: fires the tripwire on every new vote
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_recalc_vibe_score ON Live_Votes;

CREATE TRIGGER trg_recalc_vibe_score
AFTER INSERT ON Live_Votes
FOR EACH ROW
EXECUTE FUNCTION recalc_vibe_score();
