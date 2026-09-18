const express = require('express');
const router = express.Router();

// GET /api/queue/:stageId
router.get('/queue/:stageId', async (req, res) => {
  try {
    const { stageId } = req.params;
    const result = await req.pool.query(`
      SELECT q.queue_id, q.play_order, q.status, t.title, t.artist_name, t.duration_ms, t.preview_url, c.vibe_name
      FROM Live_Queue q
      JOIN Tracks t ON q.track_id = t.track_id
      LEFT JOIN Vibe_Clusters c ON t.cluster_id = c.cluster_id
      WHERE q.stage_id = $1
      ORDER BY 
        CASE q.status WHEN 'PLAYING' THEN 1 WHEN 'QUEUED' THEN 2 ELSE 3 END, 
        q.play_order ASC
    `, [stageId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/vote
router.post('/vote', async (req, res) => {
  try {
    const { stage_id, track_id, vote_value } = req.body;
    
    // Explicit 2PL Transaction to prevent lost updates on high concurrency
    const client = await req.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Explicit Row Lock (Two-Phase Locking)
      await client.query('SELECT current_vibe_score FROM Stages WHERE stage_id = $1 FOR UPDATE', [stage_id]);
      
      // Insert vote. The Postgres trigger 'trg_check_vibe_score' will execute here automatically
      // to calculate the score and rewrite the queue if necessary.
      await client.query(`
        INSERT INTO Live_Votes (stage_id, track_id, vote_value)
        VALUES ($1, $2, $3)
      `, [stage_id, track_id, vote_value]);
      
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/admin/stats
router.get('/admin/stats', async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT stage_id, stage_name, current_vibe_score, manual_override
      FROM Stages
      WHERE stage_id = 1
    `);
    
    const stats = result.rows[0];

    const currentTrackResult = await req.pool.query(`
      SELECT c.vibe_name
      FROM Live_Queue q
      JOIN Tracks t ON q.track_id = t.track_id
      JOIN Vibe_Clusters c ON t.cluster_id = c.cluster_id
      WHERE q.stage_id = 1 AND q.status = 'PLAYING'
      LIMIT 1
    `);
    
    stats.current_vibe = currentTrackResult.rows[0] ? currentTrackResult.rows[0].vibe_name : 'Unknown';

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/admin/override
router.post('/admin/override', async (req, res) => {
  try {
    const { override } = req.body;
    await req.pool.query(`UPDATE Stages SET manual_override = $1 WHERE stage_id = 1`, [override]);
    res.json({ success: true, override });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/admin/force-shift
router.post('/admin/force-shift', async (req, res) => {
  try {
    await req.pool.query(`SELECT sp_rewrite_queue(1)`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
