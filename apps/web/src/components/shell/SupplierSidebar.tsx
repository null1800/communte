'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PackagePlus,
  TrendingUp,
  Truck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const SUPPLIER_NAV: NavItem[] = [
  { href: '/supplier',                label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/supplier/offers/create',  label: 'New Product Offer', icon: PackagePlus },
  { href: '/supplier/demand',         label: 'Demand & Groups',   icon: TrendingUp },
  { href: '/supplier/orders',         label: 'Orders & Fulfilment', icon: Truck },
];

export function SupplierSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { user, switchRole } = useAuth();

  return (
    <aside
      className={[
        'cu-sidebar hidden lg:flex',
        collapsed ? 'cu-sidebar-collapsed' : '',
      ].join(' ')}
    >
      {/* Supplier Brand */}
      <div
        className={[
          'flex items-center border-b border-border shrink-0 h-[3.5rem]',
          collapsed ? 'justify-center px-3' : 'px-4 gap-3',
        ].join(' ')}
      >
        <Link href="/supplier" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 font-black text-xs">
            PRO
          </div>
          {!collapsed && (
            <div>
              <p className="font-black text-sm text-foreground leading-none tracking-tight">
                ComUnite
              </p>
              <p className="text-2xs text-accent font-semibold mt-0.5">Supplier Portal</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <nav
        className={[
          'flex-1 overflow-y-auto py-4 space-y-1',
          collapsed ? 'px-2' : 'px-3',
        ].join(' ')}
      >
        {SUPPLIER_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'cu-nav-item no-tap-highlight relative group',
                isActive ? 'cu-nav-item-active' : '',
                collapsed ? 'justify-center px-0' : '',
              ].join(' ')}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Role Switcher & User info */}
      <div className={['border-t border-border py-3', collapsed ? 'px-2' : 'px-3'].join(' ')}>
        {!collapsed && (
          <button
            onClick={() => switchRole('CUSTOMER')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary text-xs font-semibold hover:bg-primary-100 transition-colors mb-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Switch to Customer View
          </button>
        )}

        {!collapsed && user && (
          <div className="pt-2 border-t border-border flex items-center gap-3">
            <Avatar initials={user.initials} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user.supplierName || user.name}</p>
              <p className="text-2xs text-muted truncate">Supplier Account</p>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="mt-2 flex items-center justify-center w-full h-8 rounded-lg text-muted hover:bg-primary-50 hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
