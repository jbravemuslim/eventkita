import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EchoicPage } from '@/components/echoic/page';
import styles from '@/components/echoic/subpage.module.css';

export default function NotFound() {
  return (
    <EchoicPage>
      <section className="relative flex min-h-[calc(100vh-58px)] items-center overflow-hidden">
        <div className={styles.orb} aria-hidden="true" />
        <div className={styles.orbRing} aria-hidden="true" />

        <div className="container-editorial relative z-10 py-20 sm:py-24">
          <p className={`${styles.label} inline-flex items-center gap-2.5 text-ink-secondary`}>
            <span className="h-1 w-1 rounded-full bg-amber" aria-hidden="true" />
            Portal / 404
          </p>

          <p
            className={`${styles.display} ${styles.textStroke} ${styles.heroEnter} mt-8 text-[clamp(120px,24vw,320px)] font-semibold leading-[0.68]`}
            aria-hidden="true"
          >
            404
          </p>

          <h1
            className={`${styles.display} ${styles.heroEnterLate} mt-6 max-w-4xl text-[clamp(38px,5.4vw,80px)] font-semibold uppercase leading-[0.92] text-ink`}
          >
            Halaman tidak ditemukan<span className="text-amber">.</span>
          </h1>

          <p
            className={`${styles.heroEnterLater} mt-6 max-w-lg text-sm leading-7 text-ink-secondary`}
          >
            Acara atau halaman yang kamu cari mungkin sudah dihapus, belum dipublikasikan,
            atau alamatnya salah. Kembali ke portal untuk menemukan acara lain.
          </p>

          <div className={`${styles.heroEnterLater} mt-8 flex flex-wrap gap-3`}>
            <Button asChild className="h-12 rounded-none text-[10px] uppercase tracking-[0.12em]">
              <Link href="/">
                Kembali ke beranda
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-none text-[10px] uppercase tracking-[0.12em]"
            >
              <Link href="/#events">Jelajahi acara</Link>
            </Button>
          </div>

          <div className="mt-16 flex flex-wrap gap-8 border-t border-hairline pt-5">
            <span className={`${styles.label} text-muted`}>EVENTKITA / PORTAL</span>
            <span className={`${styles.label} text-teal-light`}>JAKARTA, ID</span>
            <span className={`${styles.label} text-muted`}>2026</span>
          </div>
        </div>
      </section>
    </EchoicPage>
  );
}
