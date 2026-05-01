import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync body class with sidebar state for global CSS access if needed
  useEffect(() => {
    if (!isSidebarOpen) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#FAFAF8] font-sans text-[#0C0E10]">
      {/* SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* CONTENT AREA */}
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
