-- ============================================================
-- concurrency_test.sql — manual demo of the 2PL protection
-- Run this in two separate psql sessions concurrently against
-- the SAME stage_id to prove votes aren't lost under contention.
-- ============================================================

-- SESSION A and SESSION B both run this block simultaneously,
-- pointed at stage_id = 2 (so it doesn't collide with the demo
-- in seed.sql on stage_id = 1):

BEGIN;

INSERT INTO Live_Votes (stage_id, track_id, vote_val)
VALUES (2, 201, -1);
-- The AFTER INSERT trigger fires here, takes SELECT ... FOR UPDATE
-- on Stages WHERE stage_id = 2, so the second session's trigger
-- will BLOCK until this transaction COMMITs or ROLLBACKs —
-- this is the growing/shrinking phase of 2PL in action.

COMMIT;

-- ------------------------------------------------------------
-- VERIFY: after both sessions commit, curr_vibe_score for
-- stage_id = 2 must reflect BOTH votes (e.g. -2 if both were
-- downvotes) — never just one (a "lost update").
-- ------------------------------------------------------------
SELECT stage_id, curr_vibe_score FROM Stages WHERE stage_id = 2;

-- ------------------------------------------------------------
-- Bulk spike simulation: fire 1000 votes against one stage to
-- confirm no exceptions/deadlocks and a correct final score.
-- ------------------------------------------------------------
-- DO $$
-- BEGIN
--   FOR i IN 1..1000 LOOP
--     INSERT INTO Live_Votes (stage_id, track_id, vote_val)
--     VALUES (2, 201, CASE WHEN i % 2 = 0 THEN 1 ELSE -1 END);
--   END LOOP;
-- END $$;
