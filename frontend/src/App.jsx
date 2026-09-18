import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Audience from './pages/Audience';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="nav-bar">
          <h2>Festival Stage Optimizer</h2>
          <div className="nav-links">
            <Link to="/">Audience</Link>
            <Link to="/admin">Admin</Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Audience />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
