import { cn } from '../../utils/cn';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-gray-700', className)} {...props}>
      {children}
    </label>
  );
}