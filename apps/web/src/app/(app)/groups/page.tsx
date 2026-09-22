'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, MapPin, ArrowRight, Layers, Tag } from 'lucide-react';
import { MobileTopBar } from '@/components/shell/MobileTopBar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Group } from '@communte/shared-types';

export default function MyGroupsPage() {
  const { user } = useAuth();
  const userId = user?.id || 'usr-customer-001';

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);

  const openDrawer = () => window.dispatchEvent(new Event('cu:open-drawer'));

  const loadMyGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getGroups();
      setGroups(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyGroups();
  }, [userId]);

  return (
    <>
      <MobileTopBar title="My Groups" showBack={false} onMenuOpen={openDrawer} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black tracking-tight">Buying Groups</h1>
          <p className="text-sm text-muted mt-1">
            Track active neighborhood demand groups and check processing status.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Fetching active buying groups...</p>
          </div>
        ) : error ? (
          <div className="cu-card p-6 text-center text-danger">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 cu-card">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No active buying groups yet</h3>
            <p className="text-xs text-muted mb-4 max-w-xs">
              Join an existing group or start a new group for a product offer to save together with your community.
            </p>
            <Link href="/discover">
              <Button size="sm" variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Marketplace Offers
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const committed = group.committed_quantity ?? group.funded_quantity ?? 0;
              const target = group.target_quantity ?? 1;
              const pct = Math.min(100, Math.round((committed / target) * 100));
              const isValueChain = group.fulfillment_mode === 'MODEL_B_VALUE_CHAIN';

              return (
                <div key={group.id} className="cu-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isValueChain
                              ? 'bg-success-50 text-success-800'
                              : 'bg-primary-50 text-primary'
                          }`}
                        >
                          {isValueChain ? <Layers className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                          {isValueChain ? 'Model B: Value Chain' : 'Model A: Direct Offer'}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-foreground leading-snug">{group.title}</h3>
                      <p className="text-xs text-muted mt-0.5">
                        Unit Price: ZMW {group.unit_price}
                      </p>
                    </div>
                    <span
                      className={`text-2xs font-bold px-2.5 py-1 rounded-full uppercase ${
                        group.status === 'TARGET_REACHED' || group.status === 'ORDER_CREATED' || group.status === 'FULFILLED'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-primary-50 text-primary'
                      }`}
                    >
                      {group.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground">
                        {committed} / {target} units committed
                      </span>
                      <span className="text-primary font-bold">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border">
                    <div className="flex items-center gap-2 text-2xs text-muted">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Collection Hub: {group.collection_point}</span>
                    </div>
                    <Link href={`/groups/${group.id}`}>
                      <Button size="sm" variant="secondary">
                        View Group Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
