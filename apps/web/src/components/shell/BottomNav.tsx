'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, Package, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CountBadge } from '@/components/ui/Badge';

const ITEMS = [
  { href: '/home',     label: 'Home',     icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/groups',   label: 'Groups',   icon: Users },
  { href: '/orders',   label: 'Orders',   icon: Package },
  { href: '/profile',  label: 'Me',       icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav className="cu-bottom-nav lg:hidden flex items-stretch no-tap-highlight">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/groups' ? pathname.startsWith('/groups') : pathname === href;

        const badgeCount =
          href === '/groups' ? (user?.activeGroupCount ?? 0) : 0;

        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-0.5 pt-1',
              'text-2xs font-medium transition-colors',
              isActive ? 'text-primary-700' : 'text-muted',
            ].join(' ')}
          >
            <span className="relative">
              <Icon
                className={['w-5 h-5', isActive ? 'stroke-[2.5px]' : ''].join(' ')}
              />
              {badgeCount > 0 && <CountBadge count={badgeCount} />}
            </span>
            <span className={isActive ? 'font-semibold' : ''}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
