import React, { useState, useEffect } from 'react';
import './Audience.css';

const API_URL = 'http://localhost:3001/api';
const STAGE_ID = 1;

function Audience() {
  const [queue, setQueue] = useState([]);
  const [playing, setPlaying] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_URL}/queue/${STAGE_ID}`);
      if (!res.ok) return;
      const data = await res.json();
      
      const currentlyPlaying = data.find(t => t.status === 'PLAYING');
      setPlaying(currentlyPlaying);
      
      const upcoming = data.filter(t => t.status === 'QUEUED');
      setQueue(upcoming);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (val) => {
    if (!playing) return;
    try {
      await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: STAGE_ID,
          track_id: playing.track_id,
          vote_value: val
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="audience-container">
      <div className="player-card">
        <h3>Now Playing</h3>
        {playing ? (
          <div className="track-info">
            <div className="track-title">{playing.title}</div>
            <div className="track-artist">{playing.artist_name}</div>
            <div className="vibe-badge">{playing.vibe_name}</div>
            <audio controls src={playing.preview_url} autoPlay loop />
            
            <div className="vote-controls">
              <button className="btn-vote downvote" onClick={() => handleVote(-1)}>
                👎 Hate it
              </button>
              <button className="btn-vote upvote" onClick={() => handleVote(1)}>
                👍 Love it
              </button>
            </div>
          </div>
        ) : (
          <p>No track is playing right now.</p>
        )}
      </div>

      <div className="queue-list">
        <h3>Upcoming Queue</h3>
        {queue.length === 0 ? <p>Queue is empty...</p> : (
          queue.map((track, idx) => (
            <div key={idx} className="queue-item">
              <div className="q-order">{idx + 1}</div>
              <div className="q-details">
                <div className="q-title">{track.title}</div>
                <div className="q-artist">{track.artist_name}</div>
              </div>
              <div className="q-vibe">{track.vibe_name}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Audience;
