import * as React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border border-hairline bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-ink-secondary',
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';

export { Badge };
