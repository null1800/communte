import React from 'react';
import { GroupStatus } from '@communte/shared-types';

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  DRAFT:          { label: 'Draft',          className: 'bg-muted/10 text-muted',                dot: 'bg-muted' },
  OPEN:           { label: 'Open',           className: 'bg-primary-50 text-primary-700',       dot: 'bg-primary' },
  TARGET_REACHED: { label: 'Target Reached', className: 'bg-success-100 text-success-800',     dot: 'bg-success' },
  PROCESSING:     { label: 'Processing',     className: 'bg-accent-50 text-accent-700',         dot: 'bg-accent' },
  ORDER_CREATED:  { label: 'Order Created',  className: 'bg-success-light text-success',         dot: 'bg-success' },
  CLOSED:         { label: 'Closed',         className: 'bg-muted/20 text-muted-700',            dot: 'bg-muted' },
  CANCELLED:      { label: 'Cancelled',      className: 'bg-error-light text-error',             dot: 'bg-error' },
  FUNDING:        { label: 'Funding',        className: 'bg-accent-100 text-accent-700',         dot: 'bg-accent' },
  FUNDED:         { label: 'Funded',         className: 'bg-success-light text-success',         dot: 'bg-success' },
  PARTIAL_FUNDED: { label: 'Part. Funded',   className: 'bg-success-light text-success',         dot: 'bg-success' },
  EXTENSION_VOTE: { label: 'Ext. Vote',      className: 'bg-warning-light text-warning',         dot: 'bg-warning' },
  COMPLETED:      { label: 'Completed',      className: 'bg-success-light text-success',         dot: 'bg-success' },
};

interface GroupStatusBadgeProps {
  status: string;
  className?: string;
}

export function GroupStatusBadge({ status, className = '' }: GroupStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['OPEN'];

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md',
        config.className,
        className,
      ].join(' ')}
    >
      <span className={['w-1.5 h-1.5 rounded-full shrink-0', config.dot].join(' ')} />
      {config.label}
    </span>
  );
}
