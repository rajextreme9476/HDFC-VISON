import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import GenerateBRD from './pages/GenerateBRD';
import GenerateMOM from './pages/GenerateMOM';
import GenerateTestCases from './pages/GenerateTestCases';

const allowedUsers = ['R32836', 'M12653'];
const staticPassword = 'hdfcbank';

const App: React.FC = () => {
  const [adid, setAdid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('dashboard-auth') === 'true';
    setAuthenticated(isLoggedIn);
  }, []);

  const handleLogin = () => {
    if (allowedUsers.includes(adid) && password === staticPassword) {
      localStorage.setItem('dashboard-auth', 'true');
      setAuthenticated(true);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <Router>
      <div className="app">
        {/* 🔐 Login Overlay */}
        {!authenticated && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#004C8F',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: 'white'
          }}>
            <h2>🔐 BA App Access - Login</h2>
            <input
              type="text"
              placeholder="Enter AD ID"
              value={adid}
              onChange={(e) => setAdid(e.target.value)}
              style={{ padding: 10, margin: 10, width: 250 }}
            />
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 10, margin: 10, width: 250 }}
            />
            <button onClick={handleLogin} style={{ padding: '10px 20px', marginTop: 10 }}>
              Log In
            </button>
            {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
          </div>
        )}

        {/* ✅ Actual App UI */}
        {authenticated && (
          <>
            <Sidebar />
            <div className="main-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/generate-brd" element={<GenerateBRD />} />
                <Route path="/generate-mom" element={<GenerateMOM />} />
                <Route path="/generate-test-cases" element={<GenerateTestCases />} />
                <Route path="/" element={<Dashboard />} /> {/* Default route */}
              </Routes>
            </div>
          </>
        )}
      </div>
    </Router>
  );
};

export default App;
