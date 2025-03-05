// src/components/Sidebar.tsx
import React from 'react';
import { 
  FaTachometerAlt, 
  FaClipboardList, 
  FaCheckSquare, 
  FaColumns, 
  FaShieldAlt, 
  FaChartBar, 
  FaCog 
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import './Sidebar.css';

type SidebarItemProps = {
  icon: React.ReactNode;
  text: string;
  to: string; // Add to prop for the route
  active?: boolean;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, to, active = false }) => {
  return (
    <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
      <span className="sidebar-icon">{icon}</span>
      <span className="sidebar-text">{text}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation(); // Get the current route

  // Define sidebar items with their routes
  const sidebarItems = [
    { text: 'Dashboard', to: '/dashboard', icon: <FaTachometerAlt /> },
    { text: 'Requirements', to: '/generate-brd', icon: <FaClipboardList /> },
    { text: 'Test Cases', to: '#', icon: <FaCheckSquare /> },
    { text: 'UI Comparison', to: '#', icon: <FaColumns /> },
    { text: 'Compliance', to: '#', icon: <FaShieldAlt /> },
    { text: 'Analytics', to: '#', icon: <FaChartBar /> },
    { text: 'Settings', to: '#', icon: <FaCog /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/hdfclogo.png" alt="HDFC VisionX T" />
      </div>
      <nav className="sidebar-menu">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.text}
            icon={item.icon}
            text={item.text}
            to={item.to}
            active={location.pathname === item.to} // Highlight the active route
          />
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="profile-pic-placeholder">JS</div>
        <div className="profile-info">
          <span className="profile-name">John Smith</span>
          <span className="role">Project Manager</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;