import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Deck } from '@/components/echoic/deck';
import { DriftingCircle } from '@/components/echoic/drifting-circle';
import { EchoicNav } from '@/components/echoic/nav';
import { PortalHero } from '@/components/echoic/portal-hero';
import { Reveal } from '@/components/echoic/reveal';
import { buildCategories, fallbackEvents, toLandingEvent } from '@/components/echoic/data';
import styles from '@/components/echoic/echoic.module.css';
import { getPublicEvents } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'EventKita — Temukan Acara, Bangun Komunitas' },
  description:
    'Temukan acara komunitas, seminar, workshop, dan pertunjukan di EventKita. Daftar tiket dan hadir di momen yang sedang terjadi.',
};

export default async function EventkitaHomePage() {
  const apiEvents = await getPublicEvents();
  const landingEvents = apiEvents.map(toLandingEvent);
  const deckEvents = landingEvents.length ? landingEvents.slice(0, 3) : fallbackEvents;
  const scheduleEvents = landingEvents.slice(0, 4);
  const categories = buildCategories(apiEvents);

  return (
    <div
      data-echoic-page
      lang="id"
      className={`${styles.root}`}
    >
      <EchoicNav />
      <PortalHero />

      <section
        id="cara-kerja"
        className="relative flex min-h-screen scroll-mt-[58px] items-center overflow-hidden px-6 py-32 lg:px-24"
      >
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="grid grid-cols-1 items-center md:grid-cols-12">
            <Reveal className="md:col-span-8">
              <p className={`${styles.label} mb-8 text-muted`}>
                <span className={styles.amberDot}>01 / Cara Kerja</span>
              </p>
              <h2
                className={`${styles.display} max-w-[22ch] text-[clamp(24px,3.6vw,52px)] font-semibold leading-[1.1] text-balance`}
              >
                Temukan acara yang dekat, daftar dalam hitungan menit, dan jadi bagian dari{' '}
                <span className="text-amber">momen yang sedang terjadi</span>.
              </h2>
              <div className="mt-16">
                <span
                  className={`${styles.display} ${styles.textStroke} block text-[clamp(96px,12vw,140px)] font-extrabold leading-none`}
                >
                  01
                </span>
              </div>
            </Reveal>
          </div>
        </div>
        <DriftingCircle />
      </section>

      <section
        id="events"
        className="relative scroll-mt-[58px] border-t border-hairline px-6 py-24 lg:px-24 lg:py-32"
      >
        <div className="mx-auto grid w-full max-w-screen-xl gap-14 md:grid-cols-12 md:items-center md:gap-10">
          <Reveal className="md:col-span-5">
            <p className={`${styles.label} mb-6 text-muted`}>Acara / Pilihan</p>
            <h2
              className={`${styles.display} text-[clamp(32px,4.4vw,64px)] font-semibold uppercase leading-[1.05]`}
            >
              Acara pilihan
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-secondary">
              Acara yang sedang dibuka di EventKita. Lempar kartu untuk melihat pilihan
              lainnya, lalu buka detail untuk melihat tiket dan lokasinya.
            </p>
            {apiEvents.length === 0 ? (
              <p className={`${styles.label} mt-6 text-[9px] text-muted`}>
                Contoh tampilan. Acara asli akan muncul saat API terhubung.
              </p>
            ) : null}
          </Reveal>

          <Reveal className="flex w-full flex-col items-center md:col-span-7">
            <Deck events={deckEvents} />
          </Reveal>
        </div>
      </section>

      <section
        id="kategori"
        className="scroll-mt-[58px] border-t border-hairline px-6 py-24 lg:px-24 lg:py-32"
      >
        <div className="mx-auto w-full max-w-screen-xl">
          <p className={`${styles.label} mb-12 text-muted`}>Kategori Acara</p>
          <div className="flex flex-col">
            {categories.map((category) => (
              <Reveal key={category.name}>
                <a
                  href="#events"
                  className="group flex items-center justify-between gap-6 border-b border-hairline py-8 md:py-10"
                  aria-label={`Lihat acara kategori ${category.name}`}
                >
                  <div className="flex items-center gap-5 md:gap-8">
                    <span className={`${styles.label} text-teal-light`}>{category.code}</span>
                    <h3
                      className={`${styles.display} text-2xl uppercase transition-colors group-hover:text-amber sm:text-3xl md:text-6xl`}
                    >
                      {category.name}
                    </h3>
                  </div>
                  <span className={`${styles.label} shrink-0 text-muted transition-colors group-hover:text-amber`}>
                    {category.count > 0 ? `${category.count} acara` : 'Jelajahi'}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="jadwal"
        className="scroll-mt-[58px] border-t border-hairline bg-ground-alt px-6 py-24 lg:px-24 lg:py-32"
      >
        <div className="mx-auto w-full max-w-screen-xl">
          <p className={`${styles.label} mb-12 text-muted`}>Jadwal Acara</p>
          <div className="w-full">
            <div
              className={`${styles.label} hidden grid-cols-12 gap-4 border-b border-hairline pb-4 text-muted md:grid`}
            >
              <div className="col-span-4">Acara</div>
              <div className="col-span-3">Lokasi</div>
              <div className="col-span-3">Kategori</div>
              <div className="col-span-2 text-right">Tanggal</div>
            </div>

            {scheduleEvents.length ? (
              scheduleEvents.map((event) => (
                <Reveal key={event.id}>
                  <Link
                    href={event.slug ? `/events/${event.slug}` : '#events'}
                    className="group grid grid-cols-1 gap-2 border-b border-hairline py-6 transition-colors hover:bg-white/[0.02] md:grid-cols-12 md:items-center md:gap-4 md:py-8"
                  >
                    <div
                      className={`${styles.display} text-xl uppercase transition-colors group-hover:text-amber md:col-span-4 md:text-2xl`}
                    >
                      {event.title}
                    </div>
                    <div className={`${styles.label} text-ink-secondary md:col-span-3`}>
                      {event.location}
                    </div>
                    <div className={`${styles.label} text-teal-light md:col-span-3`}>
                      {event.category}
                    </div>
                    <div className={`${styles.label} md:col-span-2 md:text-right`}>
                      {event.date}
                    </div>
                  </Link>
                </Reveal>
              ))
            ) : (
              <div className="border-b border-hairline py-10">
                <p className="text-sm text-ink-secondary">
                  Belum ada acara mendatang. Pantau terus halaman ini atau mulai buat acara
                  sendiri.
                </p>
                <Link
                  href="/register"
                  className={`${styles.label} mt-5 inline-flex h-10 items-center gap-2 border border-ink px-5 text-ink transition hover:bg-ink hover:text-ground`}
                >
                  Untuk Panitia
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        id="close"
        className="scroll-mt-[58px] overflow-hidden pt-32 md:pt-48"
      >
        <div className="mb-24 flex flex-col justify-between gap-12 px-6 md:flex-row md:items-end lg:mb-32 lg:px-24">
          <div className="max-w-xl">
            <h2 className={`${styles.display} mb-6 text-5xl uppercase`}>
              Mulai dari sini<span className="text-teal-light">.</span>
            </h2>
            <p className={`${styles.label} leading-loose text-muted`}>
              Dari komunitas untuk komunitas. Temukan acara, daftar, dan jadi bagian dari
              momen yang sedang terjadi. Punya acara sendiri? EventKita siap membantu.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="#events"
              className={`${styles.label} inline-flex h-14 items-center justify-center border border-ink px-10 transition-all hover:bg-ink hover:text-ground`}
            >
              Jelajahi Acara
            </a>
            <Link
              href="/register"
              className={`${styles.label} inline-flex h-14 items-center justify-center border border-hairline px-10 transition-all hover:border-ink`}
            >
              Untuk Panitia
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-hairline px-6 py-8 text-[10px] md:flex-row md:items-center md:justify-between lg:px-24">
          <span className={`${styles.label} text-muted`}>© 2026 EVENTKITA</span>
          <div className={`${styles.label} flex gap-8 text-muted`}>
            <a href="#" className="transition-colors hover:text-amber">
              Instagram
            </a>
            <a href="#" className="transition-colors hover:text-amber">
              TikTok
            </a>
            <a href="#" className="transition-colors hover:text-amber">
              LinkedIn
            </a>
            <Link href="/login" className="transition-colors hover:text-amber">
              Masuk
            </Link>
          </div>
        </div>

        <div className="w-full translate-y-[35%] select-none pointer-events-none" aria-hidden="true">
          <div
            className={`${styles.display} whitespace-nowrap text-[15vw] font-extrabold uppercase leading-none opacity-10`}
          >
            EVENTKITA.
          </div>
        </div>
      </section>
    </div>
  );
}
