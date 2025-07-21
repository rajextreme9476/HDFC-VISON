// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const allowedUsers = ['R32836', 'M12653'];
const staticPassword = 'hdfcbank';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [adid, setAdid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (allowedUsers.includes(adid) && password === staticPassword) {
      localStorage.setItem('user', adid); // Save session
      navigate('/dashboard');
    } else {
      setError('Invalid AD ID or Password');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <img src="/login-bg.png" alt="Login Background" style={{ maxWidth: 300 }} />
      <h2 style={{ marginTop: '20px' }}>BA Automation AI - Login</h2>
      <input
        type="text"
        placeholder="Enter AD ID"
        value={adid}
        onChange={(e) => setAdid(e.target.value)}
        style={{ padding: 10, margin: 10 }}
      />
      <br />
      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: 10, margin: 10 }}
      />
      <br />
      <button onClick={handleLogin} style={{ padding: '10px 20px' }}>
        🔐 Login
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Login;
