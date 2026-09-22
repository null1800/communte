'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Users,
  Package,
  PiggyBank,
  Bell,
  HelpCircle,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CountBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number | null;
  matchPrefix?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/home',     label: 'Home',          icon: Home },
  { href: '/discover', label: 'Discover',       icon: Compass },
  { href: '/groups',   label: 'My Groups',      icon: Users,       matchPrefix: '/groups' },
  { href: '/orders',   label: 'Orders',         icon: Package,     matchPrefix: '/orders' },
  { href: '/savings',  label: 'Savings',        icon: PiggyBank },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/help',          label: 'Help',           icon: HelpCircle },
];

const BOTTOM_NAV: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/profile',  label: 'Profile',  icon: UserCircle },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavLink({
  item,
  collapsed,
  pathname,
  badgeCount,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  badgeCount?: number;
}) {
  const isActive = item.matchPrefix
    ? pathname.startsWith(item.matchPrefix)
    : pathname === item.href;

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={[
        'cu-nav-item no-tap-highlight relative group',
        isActive ? 'cu-nav-item-active' : '',
        collapsed ? 'justify-center px-0' : '',
      ].join(' ')}
    >
      <span className="relative shrink-0">
        <Icon className="w-5 h-5" />
        {badgeCount && badgeCount > 0 ? (
          <CountBadge count={badgeCount} />
        ) : null}
      </span>

      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="
          absolute left-full ml-3 px-2 py-1 rounded-md
          bg-foreground text-white text-xs font-medium whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-150 z-50
        ">
          {item.label}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className={[
        'cu-sidebar hidden lg:flex',
        collapsed ? 'cu-sidebar-collapsed' : '',
      ].join(' ')}
    >
      {/* Logo */}
      <div className={[
        'flex items-center border-b border-border shrink-0',
        'h-[3.5rem]',
        collapsed ? 'justify-center px-3' : 'px-4 gap-3',
      ].join(' ')}>
        <Link href="/home" className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm tracking-tight">CU</span>
          </div>
          {!collapsed && (
            <div>
              <p className="font-black text-sm text-foreground leading-none tracking-tight">
                ComUnite
              </p>
              <p className="text-2xs text-muted mt-0.5">Group Purchasing</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={[
        'flex-1 overflow-y-auto py-4 space-y-0.5',
        collapsed ? 'px-2' : 'px-3',
      ].join(' ')}>

        {/* Primary nav */}
        {PRIMARY_NAV.map(item => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            badgeCount={
              item.href === '/groups' ? (user?.activeGroupCount ?? 0) :
              item.href === '/notifications' ? (user?.unreadNotifications ?? 0) :
              undefined
            }
          />
        ))}

        {/* Divider */}
        <div className="my-3 border-t border-border" />

        {/* Secondary nav */}
        {SECONDARY_NAV.map(item => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            badgeCount={
              item.href === '/notifications' ? (user?.unreadNotifications ?? 0) : undefined
            }
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className={['border-t border-border py-3', collapsed ? 'px-2' : 'px-3'].join(' ')}>
        {BOTTOM_NAV.map(item => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}

        {/* User profile row */}
        {!collapsed && user && (
          <div className="mt-3 pt-3 border-t border-border">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <Avatar initials={user.initials} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-2xs text-muted truncate">{user.phone}</p>
              </div>
            </Link>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="mt-2 flex items-center justify-center w-full h-8 rounded-lg text-muted hover:bg-primary-50 hover:text-primary transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
