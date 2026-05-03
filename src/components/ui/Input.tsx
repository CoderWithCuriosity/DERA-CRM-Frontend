import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, type = 'text', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-2.5 flex items-center text-[var(--text-tertiary)]" style={{ width: 14, height: 14 }}>
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full h-8 rounded-[var(--radius-md)] border border-[var(--border-default)]',
              'bg-[var(--bg-base)] text-[var(--text-primary)]',
              'text-[13px] font-normal',
              'placeholder:text-[var(--text-tertiary)]',
              'transition-all duration-[120ms]',
              'hover:border-[var(--border-strong)]',
              'focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-opacity-20',
              leftIcon ? 'pl-8' : 'px-3',
              rightIcon ? 'pr-8' : 'px-3',
              error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-2.5 flex items-center text-[var(--text-tertiary)]" style={{ width: 14, height: 14 }}>
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-[11px] text-[var(--danger-text)]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--text-tertiary)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';