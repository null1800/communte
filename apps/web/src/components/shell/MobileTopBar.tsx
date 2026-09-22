'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, MoreVertical, Menu, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CountBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export interface MobileTopBarProps {
  /** Page title shown in center. If omitted, logo is shown instead. */
  title?: string;
  /** Show back arrow instead of hamburger */
  showBack?: boolean;
  /** Where the back arrow navigates to */
  backHref?: string;
  /** Show inline search bar below the title row */
  showSearch?: boolean;
  /** Placeholder for the inline search bar */
  searchPlaceholder?: string;
  onSearchOpen?: () => void;
  onMenuOpen?: () => void;
  /** Show three-dot overflow menu */
  showOverflow?: boolean;
  onOverflow?: () => void;
  /** Override right side with custom actions */
  rightActions?: React.ReactNode;
}

export function MobileTopBar({
  title,
  showBack = false,
  backHref,
  showSearch = false,
  searchPlaceholder = 'Search products and groups…',
  onSearchOpen,
  onMenuOpen,
  showOverflow = false,
  onOverflow,
  rightActions,
}: MobileTopBarProps) {
  const { user } = useAuth();

  return (
    <header className="cu-mobile-topbar lg:hidden flex flex-col justify-center">
      {/* Title row */}
      <div className="flex items-center h-[3.5rem] px-4 gap-3">
        {/* Left — hamburger or back */}
        {showBack ? (
          backHref ? (
            <Link href={backHref} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background -ml-1">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
          ) : (
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background -ml-1"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )
        ) : (
          <button
            onClick={onMenuOpen}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background -ml-1"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Center — title or logo */}
        <div className="flex-1 min-w-0">
          {title ? (
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
          ) : (
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-black text-xs">CU</span>
              </div>
              <span className="font-black text-sm tracking-tight">ComUnite</span>
            </Link>
          )}
        </div>

        {/* Right — custom or default */}
        {rightActions ?? (
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {user && user.unreadNotifications > 0 && (
                <CountBadge count={user.unreadNotifications} />
              )}
            </Link>

            {/* Overflow or Avatar */}
            {showOverflow ? (
              <button
                onClick={onOverflow}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background"
              >
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
            ) : user ? (
              <Link href="/profile" className="w-9 h-9 flex items-center justify-center">
                <Avatar initials={user.initials} size="xs" />
              </Link>
            ) : null}
          </div>
        )}
      </div>

      {/* Inline search bar (optional) */}
      {showSearch && (
        <div className="px-4 pb-3">
          <button
            onClick={onSearchOpen}
            className="
              w-full flex items-center gap-3 h-10 px-4 rounded-xl
              bg-background border border-border text-muted text-sm text-left
            "
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="truncate">{searchPlaceholder}</span>
          </button>
        </div>
      )}
    </header>
  );
}
