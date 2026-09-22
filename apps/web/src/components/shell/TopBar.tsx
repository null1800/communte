'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, HelpCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  sidebarCollapsed: boolean;
  onSearchOpen: () => void;
}

export function TopBar({ sidebarCollapsed, onSearchOpen }: TopBarProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <header
      className={[
        'cu-topbar hidden lg:flex px-5 gap-4',
        sidebarCollapsed ? 'cu-topbar-collapsed' : '',
      ].join(' ')}
    >
      {/* Search bar */}
      <button
        onClick={onSearchOpen}
        className="
          flex-1 max-w-xl flex items-center gap-3
          h-9 px-4 rounded-xl
          bg-background border border-border
          text-muted text-sm
          hover:border-primary-300 hover:bg-white
          transition-colors
          text-left
        "
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="truncate">Search products, groups and categories…</span>
        <span className="ml-auto shrink-0 hidden xl:flex items-center gap-1 text-2xs text-muted border border-border rounded px-1.5 py-0.5">
          ⌘K
        </span>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        {isAuthenticated && user ? (
          <>
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
            >
              <Bell className="w-5 h-5" />
              {user.unreadNotifications > 0 && (
                <CountBadge count={user.unreadNotifications} />
              )}
            </Link>

            {/* Help */}
            <Link
              href="/help"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background text-muted hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>

            {/* Avatar */}
            <Link href="/profile" className="ml-1">
              <Avatar initials={user.initials} size="sm" />
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth" className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3">
              Sign In
            </Link>
            <Button size="sm">Join ComUnite</Button>
          </div>
        )}
      </div>
    </header>
  );
}

/** Public top bar — shown on public pages (no auth required) */
export function PublicTopBar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { isAuthenticated } = useAuth();

  return (
    <header className="hidden lg:flex items-center fixed top-0 left-0 right-0 h-[3.5rem] bg-white shadow-topbar z-30 px-6 gap-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-black text-sm">CU</span>
        </div>
        <span className="font-black text-sm tracking-tight">ComUnite</span>
      </Link>

      {/* Search */}
      <button
        onClick={onSearchOpen}
        className="
          flex items-center gap-3 h-9 px-4 rounded-xl
          bg-background border border-border text-muted text-sm
          hover:border-primary-300 hover:bg-white transition-colors
          max-w-sm flex-1
        "
      >
        <Search className="w-4 h-4 shrink-0" />
        <span>Search products and groups…</span>
      </button>

      {/* Public nav links */}
      <nav className="flex items-center gap-5 ml-4 text-sm font-medium text-muted">
        <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
        <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
      </nav>

      {/* Auth CTAs */}
      <div className="ml-auto flex items-center gap-3">
        {isAuthenticated ? (
          <Link href="/home">
            <Button size="sm" variant="primary">Open App</Button>
          </Link>
        ) : (
          <>
            <Link href="/auth" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/auth">
              <Button size="sm">Join ComUnite</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
