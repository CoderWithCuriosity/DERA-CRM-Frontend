import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}

export function GlassCard({ 
  children, 
  className = '', 
  intensity = 'medium',
  ...props 
}: GlassCardProps) {
  const intensityClasses = {
    light: 'bg-[var(--bg-base)]/50 backdrop-blur-sm',
    medium: 'bg-[var(--bg-base)]/70 backdrop-blur-md',
    heavy: 'bg-[var(--bg-base)]/90 backdrop-blur-lg',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'rounded-[var(--radius-xl)] border border-[var(--border-default)] shadow-md',
        intensityClasses[intensity],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

GlassCard.displayName = 'GlassCard';