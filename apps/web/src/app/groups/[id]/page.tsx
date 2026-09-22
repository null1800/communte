'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Layers,
  Tag,
  PieChart,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PurchaseGroup, GroupMembership } from '@communte/shared-types';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<PurchaseGroup | null>(null);
  const [members, setMembers] = useState<GroupMembership[]>([]);

  // Join Group Modal State
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinUnits, setJoinUnits] = useState(2);
  const [joinPhone, setJoinPhone] = useState(user?.phone || '+260977842109');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loadGroupDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getGroupById(groupId);
      setGroup(res.group);
      setMembers(res.memberships || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load group detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const handleOpenJoin = () => {
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/groups/${groupId}`);
      return;
    }
    setJoinModalOpen(true);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    if (!user) {
      router.push(`/auth?redirect=/groups/${groupId}`);
      return;
    }

    if (joinUnits <= 0) {
      setJoinError('Requested units must be greater than zero.');
      return;
    }

    setJoining(true);
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `10000000-1000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;

      await apiClient.commitToGroup(groupId, Number(joinUnits), idempotencyKey);
      setJoinModalOpen(false);
      await loadGroupDetails();
    } catch (err: any) {
      setJoinError(err.message || 'Failed to commit to group.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted flex flex-col items-center gap-3 min-h-screen justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading buying group progress...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-danger mx-auto" />
        <p className="font-bold text-base text-foreground">{error || 'Group not found'}</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/discover')}>
          Back to Discover
        </Button>
      </div>
    );
  }

  const committedUnits = group.committed_quantity ?? group.funded_quantity ?? 0;
  const targetUnits = group.target_quantity ?? 1;
  const fundingPercentage = Math.min(100, Math.round((committedUnits / targetUnits) * 100));
  const remainingUnits = targetUnits - committedUnits;
  const isValueChain = group.fulfillment_mode === 'MODEL_B_VALUE_CHAIN';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-muted transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`text-2xs font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1 ${
              isValueChain ? 'bg-success-50 text-success-800' : 'bg-primary-50 text-primary'
            }`}
          >
            {isValueChain ? <Layers className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
            {isValueChain ? 'Model B: Value Chain' : 'Model A: Direct Offer'}
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              group.status === 'TARGET_REACHED' || group.status === 'ORDER_CREATED' || group.status === 'FULFILLED'
                ? 'bg-success-100 text-success-800'
                : 'bg-primary-50 text-primary'
            }`}
          >
            {group.status}
          </span>
        </div>
      </div>

      {/* Main Group Summary Card */}
      <div className="cu-card p-6 space-y-4">
        <div>
          <span className="text-2xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">
            Neighborhood Demand Group
          </span>
          <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">{group.title}</h1>
          <p className="text-xs text-muted mt-0.5">
            Unit Price: ZMW {group.unit_price}
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-foreground">
              {committedUnits} of {targetUnits} units committed
            </span>
            <span className="text-primary">{fundingPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, fundingPercentage)}%` }}
            />
          </div>
          <p className="text-2xs text-muted">
            {remainingUnits > 0
              ? `${remainingUnits} units remaining to complete group target`
              : 'Group target reached! Processing supplier order.'}
          </p>
        </div>

        {/* Location & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-border">
          <div className="flex items-center space-x-2 text-muted">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span>Collection Point: {group.collection_point}</span>
          </div>
          <div className="flex items-center space-x-2 text-muted">
            <Clock className="w-4 h-4 text-accent shrink-0" />
            <span>Deadline: {new Date(group.closes_at || (group as any).deadline || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Value Chain Multi-Party Revenue Breakdown Preview (Model B) */}
      {isValueChain && (
        <div className="cu-card p-6 space-y-3 bg-gradient-to-br from-white to-primary-50/30">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Transparent Multi-Party Cost Breakdown</h3>
            </div>
            <span className="text-2xs font-bold text-success bg-success-50 px-2 py-0.5 rounded">
              Zero Middleman Rent
            </span>
          </div>

          <p className="text-2xs text-muted">
            For every ZMW {group.unit_price} spent on this staple, funds are escrowed and disbursed directly across the local value chain:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-2">
            <div className="p-2 bg-white rounded-xl border border-border">
              <p className="text-2xs text-muted font-semibold">Farmer Share</p>
              <p className="text-xs font-bold text-foreground mt-0.5">52.8%</p>
              <p className="text-3xs text-muted">Raw Maize</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-border">
              <p className="text-2xs text-muted font-semibold">Miller Fee</p>
              <p className="text-xs font-bold text-foreground mt-0.5">19.4%</p>
              <p className="text-3xs text-muted">Milling & QA</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-border">
              <p className="text-2xs text-muted font-semibold">Packaging</p>
              <p className="text-xs font-bold text-foreground mt-0.5">8.3%</p>
              <p className="text-3xs text-muted">Bags & Labels</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-border">
              <p className="text-2xs text-muted font-semibold">Logistics</p>
              <p className="text-xs font-bold text-foreground mt-0.5">8.3%</p>
              <p className="text-3xs text-muted">Bulk Freight</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-border">
              <p className="text-2xs text-muted font-semibold">Depot + Platform</p>
              <p className="text-xs font-bold text-foreground mt-0.5">11.2%</p>
              <p className="text-3xs text-muted">Hub & Escrow</p>
            </div>
          </div>
        </div>
      )}

      {/* Group Members & Participants */}
      <div className="cu-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Group Participants ({members.length})</h3>
          </div>
          <span className="text-2xs font-semibold text-muted">Real-time ledger</span>
        </div>

        {members.length === 0 ? (
          <p className="text-xs text-muted italic">No participant records found.</p>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="font-semibold text-foreground">
                    {m.user?.name || `Member ${(m.user_id || '0000').slice(-4)}`}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-muted font-semibold">
                    {m.committed_quantity ?? (m as any).units_requested ?? 0} units
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-2xs bg-success-50 text-success-700">
                    CONTRIBUTED
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      {remainingUnits > 0 && group.status === 'OPEN' && (
        <Button size="lg" fullWidth variant="accent" onClick={handleOpenJoin}>
          Join Group & Commit Units
        </Button>
      )}

      {/* Join Group Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-foreground">Join Buying Group</h3>
            <p className="text-xs text-muted">{group.title}</p>

            {joinError && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Requested Units (Max remaining: {remainingUnits})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={remainingUnits}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                  value={joinUnits}
                  onChange={(e) => setJoinUnits(Number(e.target.value))}
                />
                <p className="text-2xs text-muted mt-1">
                  Total Cost: ZMW {(joinUnits * group.unit_price).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Mobile Money Phone Number *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                  value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setJoinModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" size="sm" isLoading={joining}>
                  Confirm Contribution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
