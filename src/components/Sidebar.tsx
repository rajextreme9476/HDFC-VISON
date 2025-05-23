import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaClipboardList, 
  FaCheckSquare, 
  FaColumns, 
  FaShieldAlt, 
  FaChartBar, 
  FaCog 
} from 'react-icons/fa';
import './Sidebar.css';
/* Test Change*/
type SidebarItemProps = {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, active = false, onClick }) => {
  return (
    <div className={`sidebar-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="sidebar-icon">{icon}</span>
      <span className="sidebar-text">{text}</span>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const TachometerIcon = FaTachometerAlt as unknown as React.FC;
  const ClipboardIcon = FaClipboardList as unknown as React.FC;
  const CheckSquareIcon = FaCheckSquare as unknown as React.FC;
  const ColumnsIcon = FaColumns as unknown as React.FC;
  const ShieldAltIcon = FaShieldAlt as unknown as React.FC;
  const ChartBarIcon = FaChartBar as unknown as React.FC;
  const CogIcon = FaCog as unknown as React.FC;

  return (
    <aside className="sidebar">
    
      <nav className="sidebar-menu">
        <SidebarItem icon={<TachometerIcon />} text="Dashboard" active />
        <SidebarItem icon={<ClipboardIcon />} text="Build project requirements" onClick={() => navigate('/generate-brd')} />
        <SidebarItem icon={<ShieldAltIcon />} text="Create MOM" onClick={() => navigate('/generate-mom')} />
        <SidebarItem icon={<CheckSquareIcon />} text="Generate Testcases" onClick={() => navigate('/generate-test-cases')} />
        <SidebarItem icon={<ColumnsIcon />} text="UI Comparison" />
        <SidebarItem icon={<ChartBarIcon />} text="Analytics" />
        <SidebarItem icon={<CogIcon />} text="Settings" />
      </nav>
      <div className="sidebar-footer">
        <div className="profile-pic-placeholder">JS</div>
        <div className="profile-info">
          <span className="profile-name">Raviraj Desai</span>
          <span className="role">Project Manager</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
