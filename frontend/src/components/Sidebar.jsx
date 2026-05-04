import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Users, LogOut, Zap, 
  ChevronLeft, ChevronRight, Box, User
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
    { to: '/settings', icon: User, label: 'Profile', id: 'settings' },
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
        <span className="sidebar-logo-text uppercase tracking-wider">InvoiceFlow</span>
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

      </div>

      {/* Sidebar Bottom */}
      <div className="sidebar-bottom">
        <div className="sidebar-user mb-2">
          <div className="user-avatar bg-[#95BF47] text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <span className="user-name font-bold text-white/90">{user?.name || 'Praba'}</span>
        </div>
        
        <div 
          className="sidebar-toggle hover:bg-white/5" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <div className="flex items-center gap-2 w-full px-2">
              <ChevronLeft size={16} />
              <span className="text-[13px] font-medium">Collapse</span>
            </div>
          ) : (
            <ChevronRight size={18} />
          )}
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
