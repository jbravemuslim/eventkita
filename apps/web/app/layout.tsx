import type { Metadata } from 'next';
import { Sora, Syne } from 'next/font/google';
import { SiteChrome } from '@/components/site-chrome';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EventKita — Temukan Acara, Bangun Komunitas',
    template: '%s · EventKita',
  },
  description:
    'Temukan acara komunitas, seminar, workshop, dan pertunjukan di EventKita. Daftar tiket dan hadir di momen yang sedang terjadi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body
        className={`${syne.variable} ${sora.variable} flex min-h-screen flex-col bg-ground text-ink antialiased`}
      >
        <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
