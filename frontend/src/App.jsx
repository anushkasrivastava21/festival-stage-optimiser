import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Audience from './pages/Audience';
import Admin from './pages/Admin';
import './App.css';

function StageMark() {
  return (
    <svg
      className="stage-mark"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="9" width="2.5" height="9" fill="currentColor" />
      <rect x="6.5" y="3" width="2.5" height="15" fill="#D9381E" />
      <rect x="11" y="6" width="2.5" height="12" fill="currentColor" />
      <rect x="15.5" y="11" width="2.5" height="7" fill="currentColor" />
    </svg>
  );
}

function App() {
  return (
    <Router>
      <div className="app-shell">
        <header className="top-bar">
          <div className="top-bar-inner">
            <NavLink to="/" className="brand-lockup">
              <StageMark />
              <span className="brand-code">STAGE 01</span>
              <span className="brand-title">Festival Stage Optimizer</span>
            </NavLink>

            <nav className="top-nav" aria-label="Primary navigation">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-tab ${isActive ? 'is-active' : ''}`}
              >
                Audience
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-tab ${isActive ? 'is-active' : ''}`}
              >
                Stage Control
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="page-frame">
          <Routes>
            <Route path="/" element={<Audience />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
