import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  accent:   'bg-[var(--accent-subtle)] text-[var(--accent-text)]',
  success:  'bg-[var(--success-subtle)] text-[var(--success-text)]',
  warning:  'bg-[var(--warning-subtle)] text-[var(--warning-text)]',
  danger:   'bg-[var(--danger-subtle)] text-[var(--danger-text)]',
  info:     'bg-[var(--info-subtle)] text-[var(--info-text)]',
};

const dotColors: Record<BadgeVariant, string> = {
  default:  'bg-[var(--text-tertiary)]',
  accent:   'bg-[var(--accent)]',
  success:  'bg-[var(--success)]',
  warning:  'bg-[var(--warning)]',
  danger:   'bg-[var(--danger)]',
  info:     'bg-[var(--info)]',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('rounded-full flex-shrink-0', dotColors[variant])} style={{ width: 5, height: 5 }} />}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';