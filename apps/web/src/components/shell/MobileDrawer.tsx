'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, Users, Package,
  PiggyBank, Bell, HelpCircle,
  Settings, Info, FileText, Shield, LogOut, X, RefreshCw, LayoutDashboard, MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface DrawerNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const MAIN_NAV: DrawerNavItem[] = [
  { href: '/home',     label: 'Home',       icon: Home },
  { href: '/discover', label: 'Discover',   icon: Compass },
  { href: '/groups',   label: 'My Groups',  icon: Users },
  { href: '/orders',   label: 'Orders',     icon: Package },
  { href: '/depot',    label: 'Depot Portal', icon: MapPin },
];

const SECONDARY_NAV: DrawerNavItem[] = [
  { href: '/supplier/demand', label: 'Supplier & Miller Demand', icon: LayoutDashboard },
  { href: '/savings',          label: 'Savings',                 icon: PiggyBank },
  { href: '/notifications',    label: 'Notifications',           icon: Bell },
  { href: '/help',             label: 'Help & Support',          icon: HelpCircle },
];

const TERTIARY_NAV: DrawerNavItem[] = [
  { href: '/settings',    label: 'Settings',       icon: Settings },
  { href: '/about',       label: 'About ComUnite', icon: Info },
  { href: '/terms',       label: 'Terms of Use',   icon: FileText },
  { href: '/privacy',     label: 'Privacy Policy', icon: Shield },
];

function DrawerNavLink({
  item,
  pathname,
  onClose,
}: {
  item: DrawerNavItem;
  pathname: string;
  onClose: () => void;
}) {
  const isActive = item.href === '/groups'
    ? pathname.startsWith('/groups')
    : pathname === item.href;

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={[
        'flex items-center gap-4 px-5 py-3 text-sm font-medium transition-colors',
        isActive
          ? 'text-primary-700 bg-primary-50'
          : 'text-foreground hover:bg-background',
      ].join(' ')}
    >
      <Icon className="w-5 h-5 shrink-0 text-muted" />
      {item.label}
    </Link>
  );
}

function Divider() {
  return <div className="my-1 border-t border-border" />;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const { user, signOut, switchRole } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const el = drawerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="
          fixed top-0 left-0 bottom-0 w-72 bg-white z-50
          lg:hidden flex flex-col shadow-xl
          animate-slide-in-left
        "
      >
        <div className="flex items-center justify-between px-5 h-[3.5rem] border-b border-border shrink-0">
          <Link href="/home" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">CU</span>
            </div>
            <span className="font-black text-sm tracking-tight">ComUnite</span>
          </Link>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {user && (
          <div className="px-5 py-4 border-b border-border shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-2xs text-muted uppercase tracking-widest font-semibold">
                Your Account
              </p>
              <span className="text-2xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary">
                {user.role === 'SUPPLIER' ? 'Supplier' : 'Customer'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar initials={user.initials} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted">{user.phone}</p>
              </div>
            </div>

            {/* Role switch button inside Mobile Drawer */}
            {user.role === 'SUPPLIER' ? (
              <Link
                href="/home"
                onClick={() => {
                  switchRole('CUSTOMER');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Switch to Customer View
              </Link>
            ) : (
              <Link
                href="/supplier"
                onClick={() => {
                  switchRole('SUPPLIER');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-50 text-accent-700 border border-accent-200 text-xs font-semibold"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Switch to Supplier Portal
              </Link>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {MAIN_NAV.map(item => (
            <DrawerNavLink key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}

          <Divider />

          {SECONDARY_NAV.map(item => (
            <DrawerNavLink key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}

          <Divider />

          {TERTIARY_NAV.map(item => (
            <DrawerNavLink key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}

          <Divider />

          {user && (
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-error hover:bg-error-light transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Sign Out
            </button>
          )}
        </nav>

        <div className="px-5 py-4 border-t border-border shrink-0">
          <p className="text-2xs text-muted">
            ComUnite · Group Purchasing Platform
          </p>
        </div>
      </div>
    </>
  );
}
