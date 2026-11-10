import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './echoic/subpage.module.css';

const exploreLinks = [
  { href: '/#events', label: 'Acara' },
  { href: '/#cara-kerja', label: 'Cara Kerja' },
  { href: '/#kategori', label: 'Kategori' },
  { href: '/#jadwal', label: 'Jadwal' },
];

const accountLinks = [
  { href: '/login', label: 'Masuk' },
  { href: '/register', label: 'Daftar' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-ground">
      <div className="container-editorial py-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className={`${styles.label} inline-flex items-center gap-2.5 text-muted`}>
              <span className="h-1 w-1 rounded-full bg-amber" aria-hidden="true" />
              EventKita / Portal
            </p>
            <h2
              className={`${styles.display} mt-5 max-w-lg text-[clamp(34px,4.2vw,60px)] font-semibold uppercase leading-[0.98] text-ink`}
            >
              Kembali ke <span className="text-amber">acara.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-ink-secondary">
              Dari komunitas untuk komunitas. Temukan acara, daftar, dan jadi bagian dari
              momen yang sedang terjadi.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/#events"
                className={`${styles.label} inline-flex h-11 items-center gap-2 border border-ink px-6 text-ink transition hover:bg-ink hover:text-ground`}
              >
                Jelajahi acara
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/register"
                className={`${styles.label} inline-flex h-11 items-center gap-2 border border-hairline px-6 text-ink-secondary transition hover:border-amber hover:text-amber`}
              >
                Untuk panitia
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className={`${styles.label} text-muted`}>Jelajahi</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {exploreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-ink-secondary transition hover:text-amber"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className={`${styles.label} text-muted`}>Akun</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-ink-secondary transition hover:text-amber"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className={`${styles.label}`}>© {new Date().getFullYear()} EventKita</span>
          <div className={`${styles.label} flex flex-wrap items-center gap-x-6 gap-y-2`}>
            <span>Jakarta / ID</span>
            <span>Dari komunitas, untuk komunitas.</span>
            <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-amber">
              Beranda
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-hidden px-6 lg:px-12" aria-hidden="true">
        <div
          className={`${styles.display} translate-y-[16%] whitespace-nowrap text-[15vw] font-extrabold uppercase leading-none text-ink/5`}
        >
          EventKita.
        </div>
      </div>
    </footer>
  );
}
