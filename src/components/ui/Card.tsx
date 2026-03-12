import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  glass = false,
  hover = true,
  ...props 
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'rounded-2xl shadow-sm transition-all duration-300',
        glass ? 'bg-white/70 backdrop-blur-md border border-blue-100/50' : 'bg-white border border-gray-100',
        hover && 'hover:shadow-blue-200/40',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

Card.displayName = 'Card';