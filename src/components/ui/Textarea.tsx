import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, rows = 4, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          rows={rows}
          ref={ref}
          className={cn(
            'w-full rounded-[var(--radius-md)] border border-[var(--border-default)]',
            'bg-[var(--bg-base)] text-[var(--text-primary)]',
            'text-[13px] px-3 py-2 resize-y min-h-[80px]',
            'placeholder:text-[var(--text-tertiary)]',
            'transition-all duration-[120ms]',
            'hover:border-[var(--border-strong)]',
            'focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-opacity-20',
            error && 'border-[var(--danger)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-[var(--danger-text)]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--text-tertiary)]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';