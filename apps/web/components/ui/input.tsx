import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-hairline bg-surface px-3.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted focus:border-amber focus:ring-4 focus:ring-amber/10 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-muted',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
