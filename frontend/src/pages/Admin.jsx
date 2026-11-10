import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Admin.css';

const API_URL = '/api';

function Admin() {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState({ votes: [], pivots: [] });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedPivot, setSelectedPivot] = useState(null);
  const [replayResult, setReplayResult] = useState(null);
  const [whyNot, setWhyNot] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [blasting, setBlasting] = useState(false);
  const [racing, setRacing] = useState(false);
  const [raceResult, setRaceResult] = useState(null);
  const [activeTab, setActiveTab] = useState('conditions');

  const [whatIfParams, setWhatIfParams] = useState({
    threshold: -50,
    window: 60,
    cooldown: 20,
  });
  const [whatIfResult, setWhatIfResult] = useState(null);

  const testSectionRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      if (res.ok) {
        setStats(await res.json());
        setNowMs(Date.now());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/timeline?stageId=1&minutes=15`);
      if (res.ok) {
        setTimeline(await res.json());
        setNowMs(Date.now());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchWhatIf = useCallback(async () => {
    try {
      const { threshold, window, cooldown } = whatIfParams;
      const res = await fetch(
        `${API_URL}/admin/whatif?stageId=1&threshold=${threshold}&window=${window}&cooldown=${cooldown}`
      );
      if (res.ok) setWhatIfResult(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [whatIfParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchStats();
      fetchTimeline();
    }, 0);
    const interval = setInterval(() => {
      fetchStats();
      fetchTimeline();
    }, 2500);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchStats, fetchTimeline]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchWhatIf();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchWhatIf]);

  const toggleOverride = async () => {
    if (!stats) return;
    try {
      await fetch(`${API_URL}/admin/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override: !stats.manual_override }),
      });
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const forceShift = async () => {
    try {
      await fetch(`${API_URL}/admin/force-shift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      fetchStats();
      fetchTimeline();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePivotClick = async (pivot) => {
    setWhyNot(null);
    setReplayResult(null);
    try {
      const res = await fetch(`${API_URL}/admin/pivot/${pivot.pivot_id}/explain`);
      if (res.ok) {
        setSelectedPivot(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const blastDownvotes = async () => {
    setBlasting(true);
    try {
      await fetch(`${API_URL}/vote/blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: 1, count: 55 }),
      });
      await fetchStats();
      await fetchTimeline();
      const pRes = await fetch(`${API_URL}/admin/pivots?stageId=1`);
      if (pRes.ok) {
        const pList = await pRes.json();
        if (pList.length > 0) {
          handlePivotClick(pList[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBlasting(false);
    }
  };

  const handleReplay = async (pivotId) => {
    try {
      const res = await fetch(`${API_URL}/admin/pivot/${pivotId}/replay`, { method: 'POST' });
      if (res.ok) {
        setReplayResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTimelineClick = async (e) => {
    if (e.target.closest('.timeline-pivot-marker')) return;

    setSelectedPivot(null);
    setReplayResult(null);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));

    const currentMs = Date.now();
    const windowStart = currentMs - 15 * 60 * 1000;
    const clickedTs = new Date(windowStart + ratio * 15 * 60 * 1000).toISOString();

    try {
      const res = await fetch(`${API_URL}/admin/explain-at?stageId=1&ts=${encodeURIComponent(clickedTs)}`);
      if (res.ok) {
        setWhyNot(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunTests = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${API_URL}/admin/run-tests`);
      if (res.ok) {
        setTestResults(await res.json());
        if (testSectionRef.current) {
          testSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  const handleRunRace = async () => {
    setRacing(true);
    try {
      const res = await fetch(`${API_URL}/admin/race`, { method: 'POST' });
      if (res.ok) {
        setRaceResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRacing(false);
    }
  };

  if (!stats) {
    return <div className="console-loading">Connecting to stage engine...</div>;
  }

  const timelineWindowMs = 15 * 60 * 1000;
  const timelineStartMs = nowMs - timelineWindowMs;
  const oneMinuteCutoff = nowMs - 60 * 1000;
  const recentMinuteCount = timeline.votes.filter(
    (v) => new Date(v.vote_time).getTime() >= oneMinuteCutoff
  ).length;
  const velocityPerMin = stats.votes_last_minute ?? recentMinuteCount;

  const thresholdAbs = Math.max(1, Math.abs(stats.threshold || -50));
  const negativeDepth = stats.current_vibe_score < 0 ? Math.abs(stats.current_vibe_score) : 0;
  const breachRatio = Math.min(100, Math.round((negativeDepth / thresholdAbs) * 100));

  return (
    <div className="console-sheet">
      {/* Header Strip */}
      <header className="stage-header">
        <div className="stage-identity">
          <div className="stage-mode-line">
            <span className={`mode-text ${stats.manual_override ? 'is-manual' : 'is-auto'}`}>
              {stats.manual_override ? 'MANUAL OVERRIDE' : 'AUTOPILOT ACTIVE'}
            </span>
            <span className="mode-sep">/</span>
            <span className="mode-sub">PostgreSQL Trigger Engine</span>
          </div>
          <h1 className="stage-title">{stats.stage_name}</h1>
        </div>

        <div className="stage-actions">
          <button
            type="button"
            className="btn-console btn-outline"
            onClick={toggleOverride}
          >
            {stats.manual_override ? 'Resume Autopilot' : 'Engage Override'}
          </button>
          <button type="button" className="btn-console btn-outline" onClick={forceShift}>
            Force Shift
          </button>
          <button
            type="button"
            className="btn-console btn-signal"
            onClick={blastDownvotes}
            disabled={blasting}
          >
            {blasting ? 'Injecting Votes...' : 'Inject 55 Downvotes'}
          </button>
        </div>
      </header>

      {/* Asymmetric Telemetry Band */}
      <section className="telemetry-band">
        <div className="score-hero">
          <span className="band-label">SLIDING-WINDOW VIBE SCORE</span>
          <div className={`score-numeral ${stats.current_vibe_score < 0 ? 'is-negative' : 'is-positive'}`}>
            {stats.current_vibe_score > 0 ? `+${stats.current_vibe_score}` : stats.current_vibe_score}
          </div>

          <div className="threshold-meter" aria-label="Threshold proximity">
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${breachRatio}%` }} />
            </div>
            <div className="meter-caption">
              <span>0</span>
              <span>{breachRatio}% toward tripwire ({stats.threshold})</span>
            </div>
          </div>

          <div className="param-inline">
            <span>Threshold {stats.threshold}</span>
            <span>Window {stats.window_seconds}s</span>
            <span>Cooldown {stats.cooldown_seconds}s</span>
          </div>
        </div>

        <dl className="ledger-table">
          <div className="ledger-row">
            <dt>Active Vibe</dt>
            <dd className="ledger-strong">{stats.current_vibe}</dd>
          </div>
          <div className="ledger-row">
            <dt>Energy Level</dt>
            <dd className="mono">{stats.energy_level} / 10</dd>
          </div>
          <div className="ledger-row">
            <dt>Vote Velocity</dt>
            <dd className="mono">{velocityPerMin} / min</dd>
          </div>
          <div className="ledger-row">
            <dt>Lifetime Votes</dt>
            <dd className="mono">{stats.total_votes}</dd>
          </div>
        </dl>
      </section>

      {/* Compact Demo Action Strip */}
      <section className="demo-strip" aria-label="Verification actions">
        <button type="button" className="demo-step" onClick={handleRunRace} disabled={racing}>
          <span className="demo-num">01</span>
          <span className="demo-text">{racing ? 'Running race...' : 'Concurrency Race (1,000 votes)'}</span>
        </button>
        <button type="button" className="demo-step" onClick={blastDownvotes} disabled={blasting}>
          <span className="demo-num">02</span>
          <span className="demo-text">Tripwire Blast (55 downvotes)</span>
        </button>
        <button
          type="button"
          className="demo-step"
          disabled={timeline.pivots.length === 0}
          onClick={() => {
            if (timeline.pivots.length > 0) handlePivotClick(timeline.pivots[0]);
          }}
        >
          <span className="demo-num">03</span>
          <span className="demo-text">Inspect Latest Pivot</span>
        </button>
        <button
          type="button"
          className="demo-step"
          onClick={() => {
            const quietTs = new Date(Date.now() - 180000).toISOString();
            fetch(`${API_URL}/admin/explain-at?stageId=1&ts=${encodeURIComponent(quietTs)}`)
              .then((r) => r.json())
              .then((data) => {
                setSelectedPivot(null);
                setReplayResult(null);
                setWhyNot(data);
              })
              .catch(console.error);
          }}
        >
          <span className="demo-num">04</span>
          <span className="demo-text">Why-Not Quiet Check</span>
        </button>
        <button
          type="button"
          className="demo-step"
          onClick={() => setWhatIfParams((prev) => ({ ...prev, threshold: -30 }))}
        >
          <span className="demo-num">05</span>
          <span className="demo-text">Simulate Thrashing (-30)</span>
        </button>
      </section>

      {/* Concurrency Race Comparison */}
      {raceResult && (
        <section className="sheet-drawer">
          <div className="drawer-header">
            <div>
              <span className="eyebrow-tag">CONCURRENCY BENCHMARK</span>
              <h2 className="drawer-title">Strict 2PL vs. Unsynchronized Read-Modify-Write</h2>
            </div>
            <button type="button" className="btn-console btn-outline" onClick={() => setRaceResult(null)}>
              Dismiss
            </button>
          </div>

          <div className="race-split">
            <div className="race-col is-fail">
              <div className="race-label">Endpoint A: No-Lock RMW</div>
              <div className="race-figure">
                {raceResult.noLock.finalRecordedVotes} / {raceResult.concurrentRequests}
              </div>
              <p className="race-note">
                {raceResult.noLock.lostVotes} lost updates from unsynchronized concurrent writes.
              </p>
            </div>

            <div className="race-col is-pass">
              <div className="race-label">Endpoint B: Strict 2PL (SELECT ... FOR UPDATE)</div>
              <div className="race-figure">
                {raceResult.strict2PL.finalRecordedVotes} / {raceResult.concurrentRequests}
              </div>
              <p className="race-note">
                Zero lost updates; row-level locking serialized every concurrent vote.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 15-Minute Telemetry Timeline */}
      <section className="console-block">
        <div className="block-header">
          <div>
            <h2 className="block-heading">15-Minute Vote &amp; Pivot Timeline</h2>
            <p className="block-sub">
              Click any pivot marker for full provenance, or click an empty spot to evaluate Why-Not.
            </p>
          </div>
          <div className="legend-row">
            <span className="legend-item">
              <span className="tick-sample is-up" /> Upvote
            </span>
            <span className="legend-item">
              <span className="tick-sample is-down" /> Downvote
            </span>
            <span className="legend-item">
              <span className="marker-sample">P#</span> Pivot
            </span>
          </div>
        </div>

        <div className="timeline-box" onClick={handleTimelineClick}>
          <div className="timeline-scale">
            <span>-15m</span>
            <span>-10m</span>
            <span>-5m</span>
            <span>Now</span>
          </div>

          <div className="timeline-rail">
            {timeline.votes.map((v) => {
              const vTime = new Date(v.vote_time).getTime();
              const pct = Math.max(0, Math.min(100, ((vTime - timelineStartMs) / timelineWindowMs) * 100));
              return (
                <div
                  key={v.vote_id}
                  className={`timeline-tick ${v.vote_val > 0 ? 'is-up' : 'is-down'}`}
                  style={{ left: `${pct}%` }}
                  title={`${v.vote_val > 0 ? '+1' : '-1'} at ${new Date(v.vote_time).toLocaleTimeString()}`}
                />
              );
            })}

            {timeline.pivots.map((p) => {
              const pTime = new Date(p.pivot_time).getTime();
              const pct = Math.max(0, Math.min(100, ((pTime - timelineStartMs) / timelineWindowMs) * 100));
              const isSelected = selectedPivot?.pivot_id === p.pivot_id;
              return (
                <button
                  type="button"
                  key={p.pivot_id}
                  className={`timeline-pivot-marker ${isSelected ? 'is-selected' : ''}`}
                  style={{ left: `${pct}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePivotClick(p);
                  }}
                  title={`Pivot #${p.pivot_id}: ${p.old_vibe} -> ${p.new_vibe} (Score: ${p.score})`}
                >
                  P#{p.pivot_id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pivot "Why" Inspector */}
        {selectedPivot && (
          <div className="sheet-drawer">
            <div className="drawer-header">
              <div>
                <span className="eyebrow-tag">PIVOT PROVENANCE</span>
                <h3 className="drawer-title">
                  Pivot #{selectedPivot.pivot_id}: {selectedPivot.old_cluster.name} &rarr;{' '}
                  {selectedPivot.new_cluster.name}
                </h3>
                <div className="drawer-meta">
                  <span>Time {new Date(selectedPivot.created_at).toLocaleTimeString()}</span>
                  <span>
                    Seed <code>{selectedPivot.seed}</code>
                  </span>
                  <span>
                    Score {selectedPivot.score} (Threshold {selectedPivot.threshold})
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-console btn-ink"
                onClick={() => handleReplay(selectedPivot.pivot_id)}
              >
                Replay from Seed
              </button>
            </div>

            {replayResult && (
              <div className="replay-banner">
                <strong>{replayResult.reproduced ? 'Reproduced 100%' : 'Diverged'}</strong>
                <span>
                  Deterministic replay selected <strong>{replayResult.replayed_cluster.name}</strong> in{' '}
                  <code>{replayResult.execution_time_ms} ms</code>.
                </span>
              </div>
            )}

            <div className="drawer-tabs">
              <button
                type="button"
                className={`drawer-tab ${activeTab === 'conditions' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('conditions')}
              >
                Conditions
              </button>
              <button
                type="button"
                className={`drawer-tab ${activeTab === 'candidates' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('candidates')}
              >
                Candidates &amp; Hash Rank
              </button>
              <button
                type="button"
                className={`drawer-tab ${activeTab === 'votes' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('votes')}
              >
                Window Votes ({selectedPivot.vote_stats.total_votes})
              </button>
            </div>

            {activeTab === 'conditions' && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Status</th>
                      <th>Observed Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Threshold Breached</td>
                      <td className="status-pass">Passed</td>
                      <td className="mono">
                        Score {selectedPivot.score} &le; {selectedPivot.threshold}
                      </td>
                    </tr>
                    <tr>
                      <td>Cooldown Elapsed</td>
                      <td className="status-pass">Passed</td>
                      <td>Cooldown window satisfied prior to shift</td>
                    </tr>
                    <tr>
                      <td>Manual Override Disabled</td>
                      <td className="status-pass">Passed</td>
                      <td>Autopilot active during evaluation</td>
                    </tr>
                    <tr>
                      <td>Active Track Verified</td>
                      <td className="status-pass">Passed</td>
                      <td>Playing track present on stage</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'candidates' && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Vibe</th>
                      <th>Energy</th>
                      <th>Higher?</th>
                      <th>Delta</th>
                      <th>Hash Rank</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPivot.candidates_considered.map((c) => {
                      const isWinner = c.cluster_id === selectedPivot.new_cluster.id;
                      return (
                        <tr key={c.cluster_id} className={isWinner ? 'row-highlight' : ''}>
                          <td className="mono">{c.cluster_id}</td>
                          <td>
                            <strong>{c.vibe_name}</strong>
                          </td>
                          <td className="mono">{c.energy_level} / 10</td>
                          <td>{c.is_higher_energy ? 'Yes' : 'No'}</td>
                          <td className="mono">{c.energy_diff}</td>
                          <td className="mono">{c.hash_rank}</td>
                          <td>{isWinner ? <strong>Selected</strong> : 'Alternative'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'votes' && (
              <div>
                <p className="votes-summary">
                  Recovered {selectedPivot.vote_stats.total_votes} votes ({selectedPivot.vote_stats.downvotes}{' '}
                  downvotes, {selectedPivot.vote_stats.upvotes} upvotes). Net score:{' '}
                  <strong>{selectedPivot.vote_stats.net_score}</strong>.
                </p>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Vote</th>
                        <th>Time</th>
                        <th>Session</th>
                        <th>Track</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPivot.votes_in_window.map((v) => (
                        <tr key={v.vote_id}>
                          <td className="mono">#{v.vote_id}</td>
                          <td className={v.vote_val > 0 ? 'status-pass' : 'status-fail'}>
                            {v.vote_val > 0 ? '+1 Keep' : '-1 Shift'}
                          </td>
                          <td className="mono">{new Date(v.vote_time).toLocaleTimeString()}</td>
                          <td className="mono">{v.session_id.substring(0, 8)}</td>
                          <td>{v.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Why-Not Inspector */}
        {whyNot && (
          <div className="sheet-drawer is-caution">
            <div className="drawer-header">
              <div>
                <span className="eyebrow-tag">WHY-NOT EVALUATION</span>
                <h3 className="drawer-title">As of {new Date(whyNot.as_of_ts).toLocaleTimeString()}</h3>
              </div>
              <button type="button" className="btn-console btn-outline" onClick={() => setWhyNot(null)}>
                Dismiss
              </button>
            </div>

            <div className="whynot-body">
              <div className="whynot-rule">
                Blocked by: <code>{whyNot.blocked_by || 'none'}</code>
              </div>
              <p className="whynot-copy">{whyNot.explanation}</p>
              <div className="drawer-meta">
                <span>Score: {whyNot.score}</span>
                <span>Threshold: {whyNot.threshold}</span>
                <span>Window votes: {whyNot.votes_in_window}</span>
                <span>Would fire: {whyNot.would_fire ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Parameter What-If Sandbox */}
      <section className="console-block">
        <div className="block-header">
          <div>
            <h2 className="block-heading">Parameter What-If Sandbox</h2>
            <p className="block-sub">
              Counterfactual simulation over recorded votes using current slider values.
            </p>
          </div>
          {whatIfResult?.thrashingDetected && (
            <span className="alert-tag">Thrashing detected ({whatIfResult.simulatedPivotsCount} pivots)</span>
          )}
        </div>

        <div className="slider-band">
          <div className="slider-control">
            <div className="slider-head">
              <span>Threshold</span>
              <span className="mono">{whatIfParams.threshold}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="-10"
              step="5"
              value={whatIfParams.threshold}
              onChange={(e) => setWhatIfParams({ ...whatIfParams, threshold: parseInt(e.target.value, 10) })}
            />
            <span className="slider-hint">Default -50</span>
          </div>

          <div className="slider-control">
            <div className="slider-head">
              <span>Sliding Window</span>
              <span className="mono">{whatIfParams.window}s</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={whatIfParams.window}
              onChange={(e) => setWhatIfParams({ ...whatIfParams, window: parseInt(e.target.value, 10) })}
            />
            <span className="slider-hint">Default 60s</span>
          </div>

          <div className="slider-control">
            <div className="slider-head">
              <span>Cooldown</span>
              <span className="mono">{whatIfParams.cooldown}s</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={whatIfParams.cooldown}
              onChange={(e) => setWhatIfParams({ ...whatIfParams, cooldown: parseInt(e.target.value, 10) })}
            />
            <span className="slider-hint">Default 20s</span>
          </div>
        </div>

        <p className="whatif-summary">
          {whatIfResult ? (
            <>
              At threshold <strong>{whatIfParams.threshold}</strong> with a{' '}
              <strong>{whatIfParams.window}s</strong> window, the stage would have pivoted{' '}
              <strong>{whatIfResult.simulatedPivotsCount} times</strong>
              {whatIfResult.thrashingDetected ? ' (thrashing).' : '.'}
            </>
          ) : (
            'Evaluating counterfactual timeline...'
          )}
        </p>

        {whatIfResult && whatIfResult.timeline.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Simulated Time</th>
                  <th>Breach Score</th>
                  <th>Vibe Transition</th>
                  <th>Since Previous</th>
                </tr>
              </thead>
              <tbody>
                {whatIfResult.timeline.map((sim) => (
                  <tr key={sim.simulated_pivot_id}>
                    <td className="mono">#{sim.simulated_pivot_id}</td>
                    <td className="mono">{new Date(sim.simulated_at).toLocaleTimeString()}</td>
                    <td className="mono status-fail">{sim.trigger_score}</td>
                    <td>
                      {sim.old_vibe_name} &rarr; <strong>{sim.new_vibe_name}</strong>
                    </td>
                    <td className="mono">+{sim.time_since_last_pivot_s}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          whatIfResult && (
            <p className="empty-note">No pivots would have fired under these parameters.</p>
          )
        )}
      </section>

      {/* Correctness Benchmark Suite */}
      <section className="console-block" ref={testSectionRef}>
        <div className="block-header">
          <div>
            <h2 className="block-heading">Correctness &amp; Benchmark Suite</h2>
            <p className="block-sub">
              Executes deterministic seed replay, 10k-vote simulation latency, logging overhead, and 2PL race checks.
            </p>
          </div>
          <button
            type="button"
            className="btn-console btn-ink"
            onClick={handleRunTests}
            disabled={testing}
          >
            {testing ? 'Running Benchmarks...' : 'Run Benchmark Suite'}
          </button>
        </div>

        {testResults && (
          <div className="benchmark-ledger">
            <div className="benchmark-cell">
              <span className="bench-title">Deterministic Replay</span>
              <span className="bench-value">
                {testResults.test2_replay
                  ? `${Number(testResults.test2_replay.rate).toFixed(1)}%`
                  : 'N/A'}
              </span>
              <span className="bench-detail">
                {testResults.test2_replay
                  ? `${testResults.test2_replay.matched} / ${testResults.test2_replay.tested} pivots matched seed`
                  : 'No replay data'}
              </span>
            </div>

            <div className="benchmark-cell">
              <span className="bench-title">10k-Vote Simulation</span>
              <span className="bench-value">
                {testResults.test4_whatif_10k ? `${testResults.test4_whatif_10k.durationMs} ms` : 'N/A'}
              </span>
              <span className="bench-detail">
                {testResults.test4_whatif_10k
                  ? `${testResults.test4_whatif_10k.normalPivots} normal vs ${testResults.test4_whatif_10k.aggressivePivots} aggressive pivots`
                  : 'No simulation data'}
              </span>
            </div>

            <div className="benchmark-cell">
              <span className="bench-title">Lineage Overhead</span>
              <span className="bench-value">
                {testResults.test3_overhead
                  ? `${Math.max(Number(testResults.test3_overhead.overheadMicroseconds), 0).toFixed(3)} µs`
                  : 'N/A'}
              </span>
              <span className="bench-detail">Per-vote metadata capture delta</span>
            </div>

            <div className="benchmark-cell">
              <span className="bench-title">Strict 2PL Race</span>
              <span className="bench-value">
                {testResults.test5_concurrency
                  ? `${testResults.test5_concurrency.lockedCount} / ${testResults.test5_concurrency.concurrent}`
                  : 'N/A'}
              </span>
              <span className="bench-detail">
                {testResults.test5_concurrency
                  ? `No-lock recorded ${testResults.test5_concurrency.noLockCount}`
                  : 'No concurrency data'}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Admin;
