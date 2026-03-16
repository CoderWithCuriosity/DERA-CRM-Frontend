import  { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-deep-ink mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'w-full px-4 py-2 bg-white/70 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none',
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-blue-100 focus:ring-primary-500 focus:border-primary-500',
              className
            )}
            ref={ref}
            {...props}
          >
            {options ? (
              options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';