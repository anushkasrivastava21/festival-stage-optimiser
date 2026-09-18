import React, { useState, useEffect } from 'react';
import './Admin.css';

const API_URL = 'http://localhost:3001/api';

function Admin() {
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleOverride = async () => {
    if (!stats) return;
    try {
      await fetch(`${API_URL}/admin/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override: !stats.manual_override })
      });
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const forceShift = async () => {
    try {
      await fetch(`${API_URL}/admin/force-shift`, { method: 'POST' });
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  if (!stats) return <div className="admin-container">Loading Stage Monitor...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Stage Dashboard: {stats.stage_name}</h2>
        <div className="status-indicator">
          Autopilot: {stats.manual_override ? <span className="off">OFF</span> : <span className="on">ACTIVE</span>}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h4>Current Vibe Score</h4>
          <div className={`score-display ${stats.current_vibe_score < 0 ? 'negative' : 'positive'}`}>
            {stats.current_vibe_score}
          </div>
          <p className="threshold-info">Threshold: -5</p>
        </div>

        <div className="stat-card">
          <h4>Active Vibe Cluster</h4>
          <div className="cluster-display">{stats.current_vibe}</div>
        </div>

        <div className="stat-card controls-card">
          <h4>Admin Controls</h4>
          <button className={`btn-toggle ${stats.manual_override ? 'active' : ''}`} onClick={toggleOverride}>
            {stats.manual_override ? 'Enable Autopilot' : 'Manual Override'}
          </button>
          <button className="btn-force" onClick={forceShift} disabled={!stats.manual_override}>
            Force Vibe Shift (Requires Override)
          </button>
        </div>
      </div>
      
      <div className="logs-panel">
        <h3>Audit Logs (Database Actions)</h3>
        <p className="log-info">In a full production environment, DB triggers would log rows here.</p>
        <div className="log-entry">System online. Database monitoring live votes...</div>
      </div>
    </div>
  );
}

export default Admin;
