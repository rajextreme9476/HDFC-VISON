// src/pages/Dashboard.tsx
import React from 'react';
import { FaPhone, FaFileAlt, FaPlay, FaSearch, FaBell, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import DashboardCard from '../components/DashboardCard';
import Charts from '../components/Charts';
import RecentActivity from '../components/RecentActivity';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-logo-title">
          <img src="/hdfclogo.png" alt="HDFC Vision" className="header-logo" />
          <h1>HDFC Vision</h1>
        </div>
        <div className="header-actions">
          <div className="search-bar-container">
            {(FaSearch as any)({ className: 'search-icon' })}
            <input type="text" placeholder="Search..." className="search-bar" />
          </div>
          {(FaBell as any)({ className: 'header-icon' })}
          {(FaCog as any)({ className: 'header-icon' })}
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Projects</h3>
          <p>24</p>
          <span className="change positive">+3</span>
        </div>
        <div className="stat-card">
          <h3>Active Test Cases</h3>
          <p>186</p>
          <span className="change positive">+12</span>
        </div>
        <div className="stat-card">
          <h3>Open Issues</h3>
          <p>38</p>
          <span className="change negative">-5</span>
        </div>
        <div className="stat-card">
          <h3>Compliance Score</h3>
          <p>94%</p>
          <span className="change positive">+2%</span>
        </div>
      </div>

      <div className="dashboard-actions">
        <DashboardCard
          title="Start Teams Call"
          icon={(FaPhone as any)({})}
          subtitle="MoM/Draft Userstory"
        />
        <DashboardCard
          title="Generate BRD"
          icon={(FaFileAlt as any)({})}
          subtitle="Create from concept note"
          onClick={() => navigate('/generate-brd')}
        />
        <DashboardCard
          title="Generate Testcases"
          icon={(FaFileAlt as any)({})}
          subtitle="Create from BRD"
        />
        <DashboardCard
          title="Execute Tests"
          icon={(FaPlay as any)({})}
          subtitle="Run automated test suite"
        />
      </div>

      <Charts />
      <RecentActivity />
    </div>
  );
};

export default Dashboard;