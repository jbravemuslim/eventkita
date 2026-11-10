'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type SiteChromeProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function SiteChrome({ header, footer, children }: SiteChromeProps) {
  const pathname = usePathname();
  const isEchoicPage = pathname === '/';

  return (
    <>
      {isEchoicPage ? null : header}
      <main className="flex-1">{children}</main>
      {isEchoicPage ? null : footer}
    </>
  );
}
