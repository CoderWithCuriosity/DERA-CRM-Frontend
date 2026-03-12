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
    light: 'bg-white/50 backdrop-blur-sm',
    medium: 'bg-white/70 backdrop-blur-md',
    heavy: 'bg-white/90 backdrop-blur-lg',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'rounded-2xl border border-blue-100/50 shadow-lg',
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