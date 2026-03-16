import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-deep-ink mb-1">
            {label}
          </label>
        )}
        <textarea
          rows={rows}
          className={cn(
            'w-full px-4 py-2 bg-white/70 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-y',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-blue-100 focus:ring-primary-500 focus:border-primary-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';