import React from 'react';
import './DashboardCard.css';

type DashboardCardProps = {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  onClick?: () => void; // Add onClick prop
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, subtitle, onClick }) => {
  return (
    <div className="dashboard-card" onClick={onClick}>
      <span className="dashboard-card-icon">{icon}</span>
      <div className="dashboard-card-content">
        <span className="dashboard-card-title">{title}</span>
        {subtitle && <span className="dashboard-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

export default DashboardCard;