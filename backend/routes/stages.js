const express = require('express');
const router = express.Router();

// GET /stages/:id/current
// Returns the current playing track and vibe score
router.get('/:id/current', async (req, res) => {
  const stageId = parseInt(req.params.id);
  
  try {
    const stageRes = await req.pool.query('SELECT curr_vibe_score FROM Stages WHERE stage_id = $1', [stageId]);
    if (stageRes.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    const trackRes = await req.pool.query(`
      SELECT t.track_id, t.title, t.artist_name, t.duration 
      FROM Live_Queue lq
      JOIN Tracks t ON t.track_id = lq.track_id
      WHERE lq.stage_id = $1 AND lq.status = 1
      LIMIT 1
    `, [stageId]);

    const track = trackRes.rows.length > 0 ? trackRes.rows[0] : null;

    res.json({
      vibeScore: stageRes.rows[0].curr_vibe_score,
      currentTrack: track
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stages/:id/queue
// Returns the upcoming queue
router.get('/:id/queue', async (req, res) => {
  const stageId = parseInt(req.params.id);
  
  try {
    const queueRes = await req.pool.query(`
      SELECT lq.play_order, t.track_id, t.title, t.artist_name, t.duration
      FROM Live_Queue lq
      JOIN Tracks t ON t.track_id = lq.track_id
      WHERE lq.stage_id = $1 AND lq.status = 0
      ORDER BY lq.play_order ASC
    `, [stageId]);

    res.json({ queue: queueRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /stages/:id/vote
// Submits a vote for the current track
router.post('/:id/vote', async (req, res) => {
  const stageId = parseInt(req.params.id);
  const { voteVal, trackId } = req.body;

  if (voteVal !== 1 && voteVal !== -1) {
    return res.status(400).json({ error: 'Invalid vote value' });
  }

  try {
    // We insert into Live_Votes. The trigger handles the rest.
    await req.pool.query(
      'INSERT INTO Live_Votes (stage_id, track_id, vote_val) VALUES ($1, $2, $3)',
      [stageId, trackId, voteVal]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
