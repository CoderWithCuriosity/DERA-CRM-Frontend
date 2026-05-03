import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, options, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full h-8 rounded-[var(--radius-md)] border border-[var(--border-default)]',
              'bg-[var(--bg-base)] text-[var(--text-primary)]',
              'text-[13px] pl-3 pr-8 appearance-none',
              'transition-all duration-[120ms]',
              'hover:border-[var(--border-strong)]',
              'focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-opacity-20',
              error && 'border-[var(--danger)]',
              className
            )}
            {...props}
          >
            {options ? (
              options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            ) : (
              children
            )}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: 12, height: 12, color: 'var(--text-tertiary)' }}
          />
        </div>
        {error && <p className="text-[11px] text-[var(--danger-text)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';