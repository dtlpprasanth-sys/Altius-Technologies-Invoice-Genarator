import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Users, Settings, LogOut, Plus, Zap, ChevronLeft, ChevronRight, ChevronsUpDown, Box, User
} from 'lucide-react';

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
];

const managementNavItems = [
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/items', icon: Box, label: 'Items' },
];

const settingsNavItems = [
  { to: '/settings', icon: User, label: 'Profile' },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const renderNavItems = (items) => {
    // Safe guard: ensure items is an array before mapping
    if (!Array.isArray(items)) return null;

    return items.map(({ to, icon: Icon, label }) => {
      // Safe check for location and active route detection
      // Treats sub-routes as active (e.g., /invoices/new highlights Invoices)
      const currentPath = location?.pathname || '';
      const isActive = currentPath === to || currentPath.startsWith(`${to}/`);

      return (
        <Link
          key={to}
          to={to}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
            isActive 
              ? 'bg-purple-50 text-purple-700 font-bold shadow-sm' 
              : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-sm font-medium'
          }`}
        >
          <Icon 
            size={20} 
            strokeWidth={isActive ? 2.5 : 2} 
            className={`transition-transform duration-200 flex-shrink-0 ${!isOpen ? 'mx-auto' : ''} ${
              isActive ? 'text-purple-600' : 'group-hover:scale-110'
            }`} 
          />
          {isOpen && <span className="text-sm tracking-wide">{label}</span>}
        </Link>
      );
    });
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col z-50 shadow-soft transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo & Toggle */}
      <div className="px-5 py-6 flex items-center relative">
        <div className={`flex items-center gap-3 overflow-hidden ${!isOpen && 'justify-center w-full'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
            <Zap size={20} className="text-white fill-white/20" />
          </div>
          {isOpen && (
            <div className="flex-shrink-0 whitespace-nowrap fade-in">
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">InvoiceFlow</h1>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3.5 top-8 bg-white border border-slate-200 text-slate-400 hover:text-primary-600 rounded-full p-1 shadow-md transition-transform hover:scale-110 z-50 flex items-center justify-center"
        aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <ChevronLeft size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
      </button>

      {/* New Invoice CTA */}
      <div className="px-4 py-2 mb-6">
        <button
          onClick={() => navigate('/invoices/new')}
          className={`flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 active:scale-95 ${isOpen ? 'px-4' : 'px-0'}`}
        >
          <Plus size={isOpen ? 18 : 22} strokeWidth={3} />
          {isOpen && <span>New Invoice</span>}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-8">
        <div>
          {isOpen && <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Main</p>}
          <div className="space-y-1.5">{renderNavItems(mainNavItems)}</div>
        </div>
        <div>
          {isOpen && <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Management</p>}
          <div className="space-y-1.5">{renderNavItems(managementNavItems)}</div>
        </div>
        <div>
          {isOpen && <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System</p>}
          <div className="space-y-1.5">{renderNavItems(settingsNavItems)}</div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-200/60 mt-auto">
        <div className={`flex items-center ${isOpen ? 'gap-3 p-2' : 'justify-center py-2'} rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 transition-all cursor-pointer relative group`}>
          <div className="w-9 h-9 bg-gradient-to-tr from-primary-100 to-indigo-100 border border-primary-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-primary-800 font-black text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">{user?.email || 'admin@invoiceflow.com'}</p>
            </div>
          )}
          {isOpen && <ChevronsUpDown size={14} className="text-slate-400" />}
          
          {/* Dropdown menu */}
          <div className="absolute bottom-full left-0 mb-3 w-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl rounded-xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0 z-50">
             <button
                onClick={logout}
                className={`w-full flex items-center ${isOpen ? 'gap-2 px-3' : 'justify-center'} py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors`}
                title="Logout"
              >
                <LogOut size={16} strokeWidth={2.5} />
                {isOpen && "Log out"}
              </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
