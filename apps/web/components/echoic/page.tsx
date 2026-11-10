import type { ReactNode } from 'react';
import styles from './subpage.module.css';

export function EchoicPage({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-subpage className={`${styles.page} ${className}`.trim()}>
      <div className={styles.grain} aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function EchoicLabel({
  children,
  dot = false,
  className = '',
}: {
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={`${styles.label} inline-flex items-center gap-2.5 ${className}`.trim()}>
      {dot ? <span className="h-1 w-1 rounded-full bg-amber" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function SectionLabel({
  index,
  children,
  className = '',
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`${styles.label} flex items-center gap-3 text-muted ${className}`.trim()}>
      {index ? <span className="text-teal-light">{index}</span> : null}
      <span className="h-px w-8 bg-hairline" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
