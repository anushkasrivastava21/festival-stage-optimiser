import React, { useState, useEffect, useRef } from 'react';
import './Audience.css';

const API_URL = '/api';
const STAGE_ID = 1;
const SESSION_STORAGE_KEY = 'fso_audience_session_id';

const VIBE_PROFILES = {
  'Chill Acoustic': { bpm: 88, freq: 110, type: 'sine', gain: 0.12 },
  'Mid-Tempo Groove': { bpm: 108, freq: 92, type: 'triangle', gain: 0.14 },
  'Upbeat Pop': { bpm: 122, freq: 82, type: 'triangle', gain: 0.16 },
  'Deep House': { bpm: 125, freq: 65, type: 'sine', gain: 0.2 },
  'High Energy EDM': { bpm: 134, freq: 55, type: 'sawtooth', gain: 0.14 },
};

function getOrCreateSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
    localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return '00000000-0000-4000-8000-000000000001';
  }
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '--:--';
  const totalSec = Math.round(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function Audience() {
  const [queue, setQueue] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [voteFeedback, setVoteFeedback] = useState(null);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const sessionIdRef = useRef(getOrCreateSessionId());
  const audioCtxRef = useRef(null);

  const fetchQueue = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/queue/${STAGE_ID}`);
      if (!res.ok) {
        setLoadError(`Stage feed returned HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      const currentlyPlaying = data.find((t) => t.status?.toLowerCase() === 'playing') || null;
      const upcoming = data.filter((t) => t.status?.toLowerCase() === 'queued');

      setPlaying(currentlyPlaying);
      setQueue(upcoming);
      setLoadError(null);
    } catch {
      setLoadError('Unable to reach stage backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      fetchQueue();
    }, 0);
    const interval = setInterval(fetchQueue, 3000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchQueue]);

  const playingId = playing?.queue_id;
  const playingVibe = playing?.vibe_name;
  const playingAudioUrl = playing?.audio_url;

  // Tempo-matched beat synthesizer when track.audio_url is null
  useEffect(() => {
    if (!soundEnabled || !playingId || playingAudioUrl) {
      return undefined;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return undefined;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const profile = VIBE_PROFILES[playingVibe] || {
      bpm: 112,
      freq: 85,
      type: 'triangle',
      gain: 0.14,
    };
    const intervalMs = Math.round(60000 / profile.bpm);

    const triggerPulse = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = profile.type;
      osc.frequency.setValueAtTime(profile.freq * 1.6, now);
      osc.frequency.exponentialRampToValueAtTime(profile.freq, now + 0.09);

      amp.gain.setValueAtTime(profile.gain, now);
      amp.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    };

    triggerPulse();
    const timer = setInterval(triggerPulse, intervalMs);
    return () => clearInterval(timer);
  }, [soundEnabled, playingId, playingVibe, playingAudioUrl]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleVote = async (val) => {
    if (!playing || submittingVote) return;
    setSubmittingVote(true);

    try {
      const res = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: STAGE_ID,
          vote_val: val,
          session_id: sessionIdRef.current,
        }),
      });

      if (res.status === 429) {
        setVoteFeedback({
          tone: 'caution',
          text: 'Rate limit active — wait 3 seconds between votes.',
        });
        return;
      }

      if (!res.ok) {
        setVoteFeedback({
          tone: 'error',
          text: `Vote rejected (HTTP ${res.status}).`,
        });
        return;
      }

      setVoteFeedback({
        tone: val > 0 ? 'positive' : 'shift',
        text: val > 0 ? 'Recorded +1 — keeping current vibe.' : 'Recorded -1 — pushing toward shift.',
      });
      fetchQueue();
    } catch {
      setVoteFeedback({
        tone: 'error',
        text: 'Network error while sending vote.',
      });
    } finally {
      setSubmittingVote(false);
    }
  };

  const activeProfile = playing ? VIBE_PROFILES[playing.vibe_name] : null;

  return (
    <div className="audience-layout">
      <section className="stage-now-playing" aria-live="polite">
        <div className="eyebrow-row">
          <span className="eyebrow-label">NOW PLAYING</span>
          {playing && (
            <span className="eyebrow-meta">
              {playing.vibe_name} / {formatDuration(playing.duration_ms)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty-stage">Loading stage queue...</div>
        ) : loadError ? (
          <div className="empty-stage error-text">{loadError}</div>
        ) : playing ? (
          <div className="track-spotlight">
            <h1 className="track-headline">{playing.title}</h1>
            <p className="track-byline">{playing.artist_name}</p>

            <div className="sound-strip">
              {playing.audio_url ? (
                <audio className="track-audio" controls src={playing.audio_url} />
              ) : (
                <div className="synth-bar">
                  <button
                    type="button"
                    className={`sound-toggle ${soundEnabled ? 'is-on' : ''}`}
                    onClick={() => setSoundEnabled((prev) => !prev)}
                  >
                    {soundEnabled ? 'Mute stage beat' : 'Play stage beat'}
                  </button>
                  <span className="synth-meta">
                    {activeProfile ? `${activeProfile.bpm} BPM synthesized pulse` : 'Synthesized stage beat'}
                  </span>
                </div>
              )}
            </div>

            <div className="vote-block">
              <p className="vote-prompt">Does this fit the floor right now?</p>
              <div className="vote-actions">
                <button
                  type="button"
                  className="btn-keep"
                  disabled={submittingVote}
                  onClick={() => handleVote(1)}
                >
                  Keep this vibe (+1)
                </button>
                <button
                  type="button"
                  className="btn-shift"
                  disabled={submittingVote}
                  onClick={() => handleVote(-1)}
                >
                  Shift the vibe (-1)
                </button>
              </div>
              {voteFeedback && (
                <p className={`vote-status is-${voteFeedback.tone}`}>{voteFeedback.text}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-stage">No track is currently active on this stage.</div>
        )}
      </section>

      <aside className="stage-queue-panel">
        <div className="queue-header">
          <h2 className="queue-heading">Up Next</h2>
          <span className="queue-count">{queue.length} queued</span>
        </div>

        {queue.length === 0 ? (
          <p className="queue-empty">Queue is awaiting autopilot refill.</p>
        ) : (
          <ol className="queue-tracklist">
            {queue.map((track, idx) => (
              <li key={track.queue_id || idx} className="queue-row">
                <span className="queue-index">{String(idx + 1).padStart(2, '0')}</span>
                <div className="queue-info">
                  <div className="queue-title">{track.title}</div>
                  <div className="queue-artist">{track.artist_name}</div>
                </div>
                <div className="queue-right">
                  <span className="queue-vibe">{track.vibe_name}</span>
                  <span className="queue-duration">{formatDuration(track.duration_ms)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}

export default Audience;
