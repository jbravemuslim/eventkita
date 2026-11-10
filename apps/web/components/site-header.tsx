import Link from 'next/link';
import { AuthNav } from './auth-nav';
import styles from './echoic/subpage.module.css';

const navLinks = [
  { href: '/#events', label: 'Acara' },
  { href: '/#cara-kerja', label: 'Cara Kerja' },
  { href: '/register', label: 'Untuk Panitia' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-black/45 backdrop-blur-md">
      <div className="flex h-[58px] w-full items-center justify-between gap-4 px-6 lg:px-12">
        <Link
          href="/"
          className={`${styles.display} text-[15px] font-bold uppercase tracking-[-0.02em] text-ink`}
          aria-label="Beranda EventKita"
        >
          Event<span className="text-amber">Kita</span>
          <span className="text-amber">.</span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex" aria-label="Navigasi utama EventKita">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.label} text-[10.5px] text-ink-secondary transition-colors hover:text-amber`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <AuthNav />
      </div>
    </header>
  );
}
