import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Users, LogOut, Zap, 
  ChevronLeft, ChevronRight, Box, Settings
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { to: '/invoices', icon: FileText, label: 'Invoices', id: 'invoices', badge: true },
    { to: '/clients', icon: Users, label: 'Clients', id: 'clients' },
    { to: '/items', icon: Box, label: 'Item Master', id: 'items' },
    { to: '/settings', icon: Settings, label: 'Profile', id: 'profile' },
  ];

  const isActive = (to) => {
    const currentPath = location?.pathname || '';
    return currentPath === to || currentPath.startsWith(`${to}/`);
  };

  return (
    <aside 
      className={`sidebar ${!isOpen ? 'collapsed' : ''}`}
      onMouseLeave={() => setHoveredItem(null)}
    >
      {/* Logo Area */}
      <div className="sidebar-logo">
        <Zap className="bolt" size={18} fill="currentColor" />
        <span className="sidebar-logo-text">Nxt Invoice</span>
      </div>
      <div className="sidebar-accent"></div>

      {/* Nav Items */}
      <div className="sidebar-nav custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={`nav-item ${isActive(item.to) ? 'active' : ''}`}
            onMouseEnter={() => !isOpen && setHoveredItem(item)}
          >
            <item.icon className="nav-icon" size={18} />
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="nav-badge"></span>}
          </Link>
        ))}

        {/* Flexible space */}
        <div className="flex-1"></div>

        {/* Logout Item (Inside nav for consistency) */}
        <div 
          className="nav-item mt-auto" 
          onClick={logout}
          style={{ cursor: 'pointer', borderLeft: 'none' }}
          onMouseEnter={() => !isOpen && setHoveredItem({ label: 'Logout' })}
        >
          <LogOut size={18} className="nav-icon text-rose-400" />
          <span className="nav-label text-rose-400">Logout</span>
        </div>
      </div>

      {/* Sidebar Bottom */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <span className="user-name">{user?.name || 'Praba'}</span>
        </div>
        
        <div 
          className="sidebar-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>

      {/* Tooltip for collapsed mode */}
      {!isOpen && hoveredItem && (
        <div className="nav-tooltip visible" style={{ top: 'unset' }}>
          {hoveredItem.label}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
