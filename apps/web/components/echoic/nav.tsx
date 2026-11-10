'use client';

import { useEffect, useState } from 'react';
import styles from './echoic.module.css';

const navLinks = [
  { href: '#events', label: 'Acara', id: 'nav-events' },
  { href: '#cara-kerja', label: 'Cara Kerja', id: 'nav-cara-kerja' },
  { href: '#kategori', label: 'Kategori', id: 'nav-kategori' },
  { href: '#jadwal', label: 'Jadwal', id: 'nav-jadwal' },
];

export function EchoicNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    const onScroll = () => {
      setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    if (menuOpen) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [menuOpen]);

  return (
    <nav
      id="nav-bar"
      className="fixed left-0 top-0 z-[100] flex h-[58px] w-full items-center justify-between border-b border-hairline bg-black/40 px-6 backdrop-blur-md lg:px-12"
      aria-label="Navigasi utama EventKita"
    >
      <a
        href="#"
        className={`${styles.display} text-[15px] font-bold uppercase tracking-[-0.02em]`}
        aria-label="Beranda EventKita"
      >
        Event<span className="text-amber">Kita</span>
        <span className="text-amber">.</span>
      </a>

      <div className="hidden items-center gap-10 md:flex">
        {navLinks.map((link) => (
          <a
            id={link.id}
            key={link.href}
            href={link.href}
            className={`${styles.label} text-[10.5px] transition-colors hover:text-amber`}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <a
          id="nav-events-cta"
          href="#events"
          className={`${styles.label} hidden h-8 items-center justify-center rounded-full border border-ink px-4 text-[10px] transition-all hover:bg-ink hover:text-ground min-[380px]:flex sm:px-6`}
        >
          Jelajahi Acara
        </a>
        <button
          type="button"
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
          aria-controls="eventkita-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span
            className={`block h-px w-5 bg-ink transition-transform ${
              menuOpen ? 'translate-y-[3.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-5 bg-ink transition-transform ${
              menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {menuOpen ? (
        <div
          id="eventkita-mobile-menu"
          className="absolute left-0 top-[58px] w-full border-b border-hairline bg-ground px-6 py-5 shadow-2xl md:hidden"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`${styles.label} text-[11px] transition-colors hover:text-amber`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
