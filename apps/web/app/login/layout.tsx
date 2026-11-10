import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke portal EventKita untuk melihat tiket, acara, dan momen yang tersimpan.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
