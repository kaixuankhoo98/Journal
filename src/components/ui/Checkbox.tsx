import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, checked, ...props }, ref) => {
    return (
      <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            className="sr-only peer"
            checked={checked}
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 rounded-md border-2 transition-all duration-200',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-lavender-400 peer-focus-visible:ring-offset-2',
              checked
                ? 'bg-lavender-500 border-lavender-500'
                : 'border-gray-300 bg-white hover:border-lavender-400',
              className
            )}
          >
            {checked && (
              <Check className="w-full h-full p-0.5 text-white animate-fade-in" />
            )}
          </div>
        </div>
        {label && (
          <span
            className={cn(
              'text-sm transition-colors',
              checked ? 'text-gray-400 line-through' : 'text-gray-700'
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
