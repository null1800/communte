import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  initials: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-base',
};

export function Avatar({ initials, src, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={[
        'rounded-full flex items-center justify-center shrink-0 overflow-hidden',
        'bg-primary-100 text-primary-700 font-semibold select-none',
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={initials} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
