import React from 'react';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { GroupStatus } from '@communte/shared-types';
import { formatDeadline } from '@/lib/mock-data';
import { GroupStatusBadge } from './GroupStatusBadge';

export interface GroupProgressBarProps {
  /** Total units the group is targeting */
  targetUnits: number;
  /** Units funded so far */
  fundedUnits: number;
  /** Number of participants */
  participants: number;
  /** ISO deadline string */
  deadline: string;
  /** Group status */
  status: GroupStatus;
  /** User's own contribution (0 if not a member) */
  myContributionUnits?: number;
  /** Unit name e.g. "20L container" */
  unitName?: string;
  /** Whether to show the compact variant (for cards) */
  compact?: boolean;
  /** Override MOQ marker position (as fraction 0–1) */
  moqFraction?: number;
}

function getProgressColor(pct: number): string {
  if (pct >= 95) return 'bg-accent';
  if (pct >= 70) return 'bg-success';
  return 'bg-primary';
}

function getProgressGlow(pct: number): string {
  if (pct >= 95) return 'shadow-[0_0_8px_rgba(244,168,35,0.5)]';
  if (pct >= 70) return 'shadow-[0_0_6px_rgba(21,128,61,0.4)]';
  return '';
}

/**
 * GroupProgressBar — the signature ComUnite component.
 *
 * Works across: Product cards, Group pages, Home, My Groups,
 * Notifications, and Search results.
 */
export function GroupProgressBar({
  targetUnits,
  fundedUnits,
  participants,
  deadline,
  status,
  myContributionUnits = 0,
  unitName = 'units',
  compact = false,
  moqFraction,
}: GroupProgressBarProps) {
  const pct = Math.min(100, Math.round((fundedUnits / targetUnits) * 100));
  const remaining = targetUnits - fundedUnits;
  const deadlineLabel = formatDeadline(deadline);
  const isClosed = status === 'COMPLETED' || status === 'CANCELLED';

  const barColor = isClosed ? (status === 'COMPLETED' ? 'bg-success' : 'bg-muted') : getProgressColor(pct);
  const barGlow = isClosed ? '' : getProgressGlow(pct);

  if (compact) {
    /* ── Compact variant: progress bar + key stats in one row ── */
    return (
      <div className="space-y-2">
        {/* Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 cu-progress-track h-2 rounded-full">
            <div
              className={['h-full rounded-full transition-all duration-700', barColor, barGlow].join(' ')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={['text-xs font-bold tabular-nums shrink-0',
            pct >= 95 ? 'text-accent-600' : pct >= 70 ? 'text-success' : 'text-primary'
          ].join(' ')}>
            {pct}%
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-2xs text-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participants}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deadlineLabel}
          </span>
          {myContributionUnits > 0 && (
            <span className="ml-auto font-semibold text-primary-700">
              You: {myContributionUnits} {unitName}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── Full variant: detailed stats ── */
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className={[
          'text-2xl font-black tabular-nums',
          pct >= 95 ? 'text-accent-600' : pct >= 70 ? 'text-success' : 'text-primary',
        ].join(' ')}>
          {pct}%
        </span>
        <GroupStatusBadge status={status} />
      </div>

      {/* Progress bar track */}
      <div className="relative">
        <div className="cu-progress-track h-3.5 rounded-full">
          <div
            className={['h-full rounded-full transition-all duration-700 animate-progress-fill', barColor, barGlow].join(' ')}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* MOQ marker */}
        {moqFraction && moqFraction < 1 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-warning"
            style={{ left: `${moqFraction * 100}%` }}
            title="Minimum Order Quantity"
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs font-bold text-foreground tabular-nums">
            {fundedUnits} / {targetUnits}
          </p>
          <p className="text-2xs text-muted mt-0.5">{unitName} funded</p>
        </div>
        <div>
          <p className="text-xs font-bold text-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-muted" />
            {participants}
          </p>
          <p className="text-2xs text-muted mt-0.5">participants</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-foreground flex items-center gap-1 justify-end">
            <Clock className="w-3.5 h-3.5 text-muted" />
            {deadlineLabel}
          </p>
          <p className="text-2xs text-muted mt-0.5">remaining</p>
        </div>
      </div>

      {/* Remaining units */}
      {!isClosed && remaining > 0 && (
        <p className="text-xs text-muted">
          <span className="font-semibold text-foreground">{remaining} {unitName}</span> needed to reach target
        </p>
      )}

      {/* User contribution */}
      {myContributionUnits > 0 && (
        <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2 border border-primary-100">
          <TrendingUp className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary-700 font-medium">
            Your contribution: <span className="font-bold">{myContributionUnits} × {unitName}</span>
          </p>
        </div>
      )}
    </div>
  );
}
