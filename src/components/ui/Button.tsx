import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm active:scale-[0.98]',
  secondary: 'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)]',
  ghost:     'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
  danger:    'bg-[var(--danger)] text-white hover:opacity-90 shadow-sm active:scale-[0.98]',
  outline:   'bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-[11px] gap-1 rounded-[var(--radius-sm)]',
  sm: 'h-7 px-2.5 text-[12px] gap-1.5 rounded-[var(--radius-md)]',
  md: 'h-8 px-3 text-[13px] gap-2 rounded-[var(--radius-md)]',
  lg: 'h-9 px-4 text-[14px] gap-2 rounded-[var(--radius-lg)]',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none',
        'transition-all duration-[120ms] ease-out',
        'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        fullWidth && 'w-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading
        ? <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />
        : icon && <span className="flex items-center" style={{ width: 14, height: 14 }}>{icon}</span>
      }
      {children}
      {iconRight && <span className="flex items-center" style={{ width: 14, height: 14 }}>{iconRight}</span>}
    </motion.button>
  );
}

Button.displayName = 'Button';