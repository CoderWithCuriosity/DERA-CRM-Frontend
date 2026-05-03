import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false,
  ...props 
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.12 }}
      className={cn(
        'rounded-[var(--radius-xl)] border border-[var(--border-default)]',
        'bg-[var(--bg-base)]',
        'transition-all duration-[120ms]',
        hover && 'hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

Card.displayName = 'Card';

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]', className)}
      {...props}
    >
      {children}
    </h3>
  );
}