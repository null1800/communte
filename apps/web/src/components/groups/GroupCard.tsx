import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { PurchaseGroup } from '@communte/shared-types';
import { GroupProgressBar } from './GroupProgressBar';
import { Button } from '@/components/ui/Button';

interface GroupCardProps {
  group: PurchaseGroup & {
    productName?: string;
    productUnit?: string;
    myContributionUnits?: number;
    collectionPoint?: string;
  };
  /** Show the "View Group" CTA */
  showAction?: boolean;
  /** Compact mode — smaller footprint */
  compact?: boolean;
  participants?: number;
}

export function GroupCard({
  group,
  showAction = true,
  compact = false,
  participants = 36,
}: GroupCardProps) {
  return (
    <div className="cu-card cu-card-hover p-4 flex flex-col gap-4">
      {/* Product name */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm text-foreground leading-snug">
            {group.productName || (group as any).product_name || `Group #${group.id.slice(-4)}`}
          </h3>
          <p className="text-xs text-muted mt-0.5">{group.productUnit || (group as any).unit || 'units'}</p>
        </div>
      </div>

      {/* Progress */}
      <GroupProgressBar
        targetUnits={group.target_quantity ?? (group as any).target_units ?? 100}
        fundedUnits={group.committed_quantity ?? (group as any).funded_units ?? 0}
        participants={participants}
        deadline={group.closes_at ?? (group as any).deadline ?? new Date().toISOString()}
        status={(group.status as any)}
        myContributionUnits={group.myContributionUnits ?? 0}
        unitName={group.productUnit || 'units'}
        compact={compact}
      />

      {/* Collection point */}
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{group.collectionPoint || group.collection_point || 'Community Hub'}</span>
      </div>

      {/* CTA */}
      {showAction && (
        <Link href={`/groups/${group.id}`} className="mt-auto">
          <Button
            variant={(group.myContributionUnits ?? 0) > 0 ? 'secondary' : 'primary'}
            size="sm"
            fullWidth
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {(group.myContributionUnits ?? 0) > 0 ? 'View Group' : 'Join Group'}
          </Button>
        </Link>
      )}
    </div>
  );
}
