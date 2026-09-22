'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppRole, UserRole } from '@communte/shared-types';
import { apiClient, setAccessToken } from '../lib/api-client';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: AppRole;
  initials: string;
  supplierId?: string;
  supplierName?: string;
  activeGroupCount: number;
  unreadNotifications: number;
  lifetimeSavings: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (phone: string, role?: AppRole | UserRole, name?: string) => Promise<AuthUser>;
  switchRole: (role: AppRole) => Promise<void>;
  signOut: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'cu_session_v3';

// Fixed canonical user IDs for local/demo environment session persistence
const DEFAULT_CUSTOMER_ID = 'c0000000-0000-0000-0000-000000000001';
const DEFAULT_SUPPLIER_ID = 's0000000-0000-0000-0000-000000000001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authenticateSession = useCallback(async (userId: string, role: AppRole, name?: string, phone?: string): Promise<AuthUser> => {
    try {
      const { accessToken } = await apiClient.obtainDevelopmentToken(userId, [role]);
      setAccessToken(accessToken);

      const authUser: AuthUser = {
        id: userId,
        phone: phone || (role === 'SUPPLIER' ? '+260971234567' : '+260979876543'),
        name: name || (role === 'SUPPLIER' ? 'AgriSupply Zambia' : 'Chileshe Mwamba'),
        role,
        initials: role === 'SUPPLIER' ? 'AS' : 'CM',
        supplierId: role === 'SUPPLIER' ? 'sup-profile-001' : undefined,
        supplierName: role === 'SUPPLIER' ? 'AgriSupply Zambia' : undefined,
        activeGroupCount: 1,
        unreadNotifications: 2,
        lifetimeSavings: 450,
      };

      setUser(authUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      return authUser;
    } catch (err) {
      console.error('Failed to establish authenticated session with backend API:', err);
      // Construct local fallback session
      const fallbackUser: AuthUser = {
        id: userId,
        phone: phone || '+260970000000',
        name: name || 'Demo User',
        role,
        initials: 'DU',
        activeGroupCount: 0,
        unreadNotifications: 0,
        lifetimeSavings: 0,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          await authenticateSession(parsed.id, parsed.role, parsed.name, parsed.phone);
        } else {
          // Default to Customer session on initial load
          await authenticateSession(DEFAULT_CUSTOMER_ID, 'CUSTOMER', 'Chileshe Mwamba', '+260979876543');
        }
      } catch (e) {
        console.warn('Auth initialization fallback:', e);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, [authenticateSession]);

  const signIn = useCallback(
    async (phone: string, role: AppRole | UserRole = 'CUSTOMER', name?: string): Promise<AuthUser> => {
      const appRole: AppRole = role === 'SUPPLIER' || role === 'platform_admin' ? 'SUPPLIER' : 'CUSTOMER';
      const targetId = appRole === 'SUPPLIER' ? DEFAULT_SUPPLIER_ID : DEFAULT_CUSTOMER_ID;
      return authenticateSession(targetId, appRole, name, phone);
    },
    [authenticateSession],
  );

  const switchRole = useCallback(
    async (newRole: AppRole) => {
      const targetId = newRole === 'SUPPLIER' ? DEFAULT_SUPPLIER_ID : DEFAULT_CUSTOMER_ID;
      const targetName = newRole === 'SUPPLIER' ? 'AgriSupply Zambia' : 'Chileshe Mwamba';
      await authenticateSession(targetId, newRole, targetName);
    },
    [authenticateSession],
  );

  const signOut = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        signIn,
        switchRole,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
