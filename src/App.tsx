import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import GenerateBRD from './pages/GenerateBRD';
import GenerateMOM from './pages/GenerateMOM';
import GenerateTestCases from './pages/GenerateTestCases';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/generate-brd" element={<GenerateBRD />} />
            <Route path="/generate-mom" element={<GenerateMOM />} />
            <Route path="/generate-test-cases" element={<GenerateTestCases/>} />
            <Route path="/" element={<Dashboard />} /> {/* Default route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;