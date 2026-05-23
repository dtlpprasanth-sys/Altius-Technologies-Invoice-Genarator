import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Users, LogOut,
  ChevronLeft, ChevronRight, Box, User, Shield
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Listen to resize to update mobile flag
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { to: '/invoices', icon: FileText, label: 'Invoices', id: 'invoices' },
    { to: '/clients', icon: Users, label: 'Clients', id: 'clients' },
    { to: '/items', icon: Box, label: 'Item Master', id: 'items' },
    { to: '/settings', icon: User, label: 'Profile', id: 'settings' },
  ];

  if (user?.isAdmin) {
    navItems.push({ to: '/admin/dashboard', icon: Shield, label: 'Manage Admins', id: 'manage-admins' });
  }

  const isActive = (to) => {
    const currentPath = location?.pathname || '';
    return currentPath === to || currentPath.startsWith(`${to}/`);
  };

  // Close sidebar on mobile when a link is clicked
  const handleNavClick = () => {
    if (isMobile) setIsOpen(false);
  };

  return (
    <aside className={`sidebar ${!isOpen ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
      onMouseLeave={() => setHoveredItem(null)}>

      {/* Logo Area */}
      <div className="sidebar-logo flex items-center justify-start h-[56px] px-4 overflow-hidden">
        <img src="/logo-symbol.png" alt="Logo" className="w-[32px] h-[32px] mr-2 object-contain flex-shrink-0" />
        {isOpen && (
          <span className="sidebar-logo-text uppercase tracking-wider font-extrabold text-[11px] text-[#0c0e10]">
            Altius Technologies
          </span>
        )}
      </div>
      <div className="sidebar-accent" />

      {/* Nav Items */}
      <div className="sidebar-nav custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={`nav-item ${isActive(item.to) ? 'active' : ''}`}
            onMouseEnter={() => !isOpen && setHoveredItem(item)}
            onClick={handleNavClick}
          >
            <item.icon className="nav-icon" size={18} />
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        <div
          className="nav-item text-red-500 hover:bg-red-50 mb-4 cursor-pointer transition-colors"
          onClick={logout}
          onMouseEnter={() => !isOpen && setHoveredItem({ label: 'Log out' })}
        >
          <LogOut className="nav-icon !text-red-500" size={18} />
          <span className="nav-label !text-red-500 !font-semibold">Log out</span>
        </div>

        <div className="sidebar-user mb-2">
          <div className="user-avatar bg-[#95BF47] text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <span className="user-name font-bold text-white/90">{user?.name || 'Praba'}</span>
        </div>

        <div className="sidebar-toggle hover:bg-white/5" onClick={() => setIsOpen(!isOpen)}>
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

      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}
    </aside>
  );
};

export default Sidebar;
