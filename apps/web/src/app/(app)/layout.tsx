'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { BottomNav } from '@/components/shell/BottomNav';
import { MobileDrawer } from '@/components/shell/MobileDrawer';
import { SearchOverlay } from '@/components/search/SearchOverlay';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [searchOpen, setSearchOpen]             = useState(false);

  // Expose drawer opener on a custom event so MobileTopBar can trigger it
  React.useEffect(() => {
    const handler = () => setDrawerOpen(true);
    window.addEventListener('cu:open-drawer', handler);
    return () => window.removeEventListener('cu:open-drawer', handler);
  }, []);

  // Expose search opener
  React.useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener('cu:open-search', handler);
    // Keyboard shortcut
    const kb = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', kb);
    return () => {
      window.removeEventListener('cu:open-search', handler);
      window.removeEventListener('keydown', kb);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-black text-base">CU</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      {/* Desktop top bar */}
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onSearchOpen={() => setSearchOpen(true)}
      />

      {/* Mobile hamburger drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Global search overlay */}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Main content */}
      <main
        className={[
          // Desktop: offset by sidebar
          'transition-all duration-200',
          'lg:pt-[3.5rem]',
          sidebarCollapsed ? 'lg:ml-[4rem]' : 'lg:ml-[15rem]',
          // Mobile: offset by top bar + bottom nav
          'pt-[3.5rem] pb-[4rem] lg:pb-0',
        ].join(' ')}
      >
        {children}
      </main>
    </div>
  );
}
