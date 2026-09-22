import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'accent' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-50 text-primary-700',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  error:   'bg-error-light text-error',
  accent:  'bg-accent-100 text-accent-700',
  muted:   'bg-gray-100 text-muted',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error:   'bg-error',
  accent:  'bg-accent',
  muted:   'bg-muted',
};

export function Badge({ variant = 'default', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        'text-2xs font-semibold uppercase tracking-wider',
        'px-2 py-0.5 rounded-md',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={['w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant]].join(' ')}
        />
      )}
      {children}
    </span>
  );
}

/** Notification count badge — small circle with a number */
export function CountBadge({ count, max = 99 }: { count: number; max?: number }) {
  if (count === 0) return null;
  const display = count > max ? `${max}+` : String(count);
  return (
    <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center rounded-full bg-error text-white text-2xs font-bold px-0.5">
      {display}
    </span>
  );
}
