'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackagePlus, TrendingUp, Truck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SupplierSidebar } from '@/components/shell/SupplierSidebar';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const { user, switchRole } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <SupplierSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Mobile Contextual Top Bar for Supplier */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-[3.5rem] bg-white border-b border-border z-30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent text-white flex items-center justify-center font-black text-2xs">
            PRO
          </div>
          <div>
            <p className="text-xs font-black text-foreground leading-tight">Supplier Portal</p>
            <p className="text-2xs text-muted leading-tight">{user?.supplierName || 'Zambezi Fresh'}</p>
          </div>
        </div>
        <button
          onClick={() => switchRole('CUSTOMER')}
          className="flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-md bg-primary-50 text-primary border border-primary-100"
        >
          <RefreshCw className="w-3 h-3" />
          Customer Mode
        </button>
      </header>

      {/* Mobile Bottom Navigation for Supplier */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[3.75rem] bg-white border-t border-border z-30 flex items-center justify-around px-2">
        <Link
          href="/supplier"
          className={`flex flex-col items-center justify-center gap-0.5 ${
            pathname === '/supplier' ? 'text-accent font-bold' : 'text-muted'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-2xs">Overview</span>
        </Link>
        <Link
          href="/supplier/offers/create"
          className={`flex flex-col items-center justify-center gap-0.5 ${
            pathname === '/supplier/offers/create' ? 'text-accent font-bold' : 'text-muted'
          }`}
        >
          <PackagePlus className="w-5 h-5" />
          <span className="text-2xs">New Offer</span>
        </Link>
        <Link
          href="/supplier/demand"
          className={`flex flex-col items-center justify-center gap-0.5 ${
            pathname === '/supplier/demand' ? 'text-accent font-bold' : 'text-muted'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-2xs">Demand</span>
        </Link>
        <Link
          href="/supplier/orders"
          className={`flex flex-col items-center justify-center gap-0.5 ${
            pathname === '/supplier/orders' ? 'text-accent font-bold' : 'text-muted'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-2xs">Orders</span>
        </Link>
      </nav>

      {/* Main Content Area */}
      <main
        className={[
          'transition-all duration-200 min-h-screen',
          'lg:pt-6 lg:pb-12',
          sidebarCollapsed ? 'lg:ml-[4rem]' : 'lg:ml-[15rem]',
          'pt-[4rem] pb-[4.5rem] lg:pb-6',
        ].join(' ')}
      >
        <div className="max-w-6xl mx-auto px-4 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
