import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import styles from './subpage.module.css';

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  index: string;
  icon: ReactNode;
  hint?: string;
  action?: ReactNode;
};

export function AuthField({
  id,
  label,
  index,
  icon,
  hint,
  action,
  className,
  ...props
}: AuthFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={`${styles.label} text-ink-secondary`}>
          <span className="mr-2 text-muted">{index}</span>
          {label}
        </label>
        {hint ? (
          <span id={hintId} className="text-[10px] text-muted">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="relative mt-2">
        <span
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted [&>svg]:h-4 [&>svg]:w-4"
          aria-hidden="true"
        >
          {icon}
        </span>
        <Input
          id={id}
          data-auth-field="true"
          aria-describedby={hintId}
          className={cn(
            styles.fieldInput,
            'h-12 rounded-none border-0 border-b border-hairline bg-transparent px-0 pl-7 text-base shadow-none placeholder:text-muted/70 focus:border-amber focus:ring-0',
            action ? 'pr-11' : '',
            className,
          )}
          {...props}
        />
        {action ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div>
        ) : null}
      </div>
    </div>
  );
}
