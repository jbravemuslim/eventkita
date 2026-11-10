import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatEventDate, formatIdr } from '@eventkita/shared';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { EventTile } from '@/components/echoic/event-tile';
import { EchoicPage, SectionLabel } from '@/components/echoic/page';
import { RemoteImage } from '@/components/echoic/remote-image';
import { TicketClaim } from '@/components/echoic/ticket-claim';
import { toLandingEvent } from '@/components/echoic/data';
import styles from '@/components/echoic/subpage.module.css';
import { getPublicEvent, getPublicEvents } from '@/lib/api';

export const dynamic = 'force-dynamic';

const loadEvent = cache(getPublicEvent);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);

  if (!event) {
    return { title: 'Acara tidak ditemukan' };
  }

  return {
    title: event.title,
    description: event.description.slice(0, 160),
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, publicEvents] = await Promise.all([loadEvent(slug), getPublicEvents()]);

  if (!event) {
    notFound();
  }

  const landing = toLandingEvent(event);
  const heroImage = event.bannerUrl ?? landing.image;
  const totalRemaining = event.ticketTypes.reduce(
    (total, ticketType) => total + ticketType.remainingQuota,
    0,
  );
  const summaryLimit = 220;
  const summary =
    event.description.length > summaryLimit
      ? `${event.description
          .slice(0, summaryLimit)
          .replace(/\s+\S*$/, '')
          .trimEnd()}…`
      : event.description;
  const relatedEvents = publicEvents
    .filter((item) => item.slug !== event.slug)
    .slice(0, 2)
    .map(toLandingEvent);

  const meta = [
    {
      label: 'Waktu',
      value: formatEventDate(event.startAt, event.endAt, event.timezone),
    },
    {
      label: 'Lokasi',
      value: `${event.locationName}${event.address ? ` · ${event.address}` : ''}`,
    },
    {
      label: 'Kuota',
      value: `${totalRemaining} tiket tersedia`,
    },
    {
      label: 'Pembayaran',
      value: 'Diverifikasi manual oleh panitia',
    },
  ];

  return (
    <EchoicPage>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(232,145,60,0.18),transparent_48%),linear-gradient(135deg,#151a1f,#0a0c0e)]">
        <RemoteImage
          src={heroImage}
          alt={`Banner acara ${event.title}`}
          className={`absolute inset-0 h-full w-full object-cover object-center opacity-60 ${styles.heroImage}`}
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,0.55),rgba(10,12,14,0.34)_42%,rgba(10,12,14,0.98))]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(232,145,60,0.2),transparent_44%)]"
          aria-hidden="true"
        />

        <div className="container-editorial relative flex min-h-[72vh] flex-col justify-between pb-10 pt-8 lg:min-h-[78vh] lg:pb-14 lg:pt-12">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/#events"
              className={`${styles.label} inline-flex h-9 items-center gap-2 border border-hairline bg-ground/55 px-4 text-ink-secondary backdrop-blur transition hover:border-amber hover:text-amber`}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Kembali
            </Link>
            <span className={`${styles.label} text-ink-secondary`}>
              Acara / {landing.categoryCode}
            </span>
          </div>

          <div className="mt-24 max-w-5xl">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`${styles.label} border border-amber/40 bg-ground/50 px-3 py-1.5 text-amber backdrop-blur`}
              >
                {event.category}
              </span>
              <span className={`${styles.label} text-ink-secondary`}>{event.locationName}</span>
              <span className={`${styles.label} text-teal-light`}>{landing.date}</span>
            </div>

            <h1
              className={`${styles.display} ${styles.heroEnter} mt-6 max-w-[13ch] text-[clamp(42px,7.4vw,112px)] font-semibold uppercase leading-[0.9] text-ink`}
            >
              {event.title}
            </h1>

            <div
              className={`${styles.heroEnterLate} mt-8 flex flex-col gap-6 border-t border-hairline pt-5 sm:flex-row sm:items-end sm:justify-between`}
            >
              <p className="max-w-lg text-sm leading-6 text-ink-secondary">{summary}</p>
              <a
                href="#tickets"
                className={`${styles.label} inline-flex items-center gap-2 text-ink-secondary transition hover:text-amber`}
              >
                Lihat tiket
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-hairline bg-ground-alt">
        <div className="container-editorial grid grid-cols-2 border-t border-hairline lg:grid-cols-4">
          {meta.map((item, index) => (
            <div
              key={item.label}
              className="border-b border-hairline py-5 pr-4 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
            >
              <p className={`${styles.label} text-muted`}>
                <span className="text-teal-light">{String(index + 1).padStart(2, '0')}</span>
                <span className="mx-2 text-hairline-strong">/</span>
                {item.label}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-secondary">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="container-editorial grid gap-16 py-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-28">
        <div className="min-w-0">
          <SectionLabel index="01">Tentang acara</SectionLabel>
          <h2
            className={`${styles.display} mt-6 max-w-[16ch] text-[clamp(34px,4.4vw,64px)] uppercase leading-[1.02] text-ink`}
          >
            Cerita di balik acara<span className="text-amber">.</span>
          </h2>
          <p className="mt-8 max-w-2xl whitespace-pre-line text-sm leading-7 text-ink-secondary">
            {event.description}
          </p>

          {event.terms ? (
            <div className="mt-14 border-t border-hairline pt-8">
              <SectionLabel index="02">Ketentuan tiket</SectionLabel>
              <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-7 text-ink-secondary">
                {event.terms}
              </p>
            </div>
          ) : null}

          <div className="mt-12 flex flex-col gap-4 border border-hairline bg-ground-alt p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`${styles.label} text-muted`}>Catatan komunitas</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-ink-secondary">
                Acara dikelola langsung oleh panitia komunitas. Simpan e-ticket dan datang
                lebih awal untuk pengalaman terbaik.
              </p>
            </div>
            <ShieldCheck className="h-8 w-8 shrink-0 text-teal-light" aria-hidden="true" />
          </div>
        </div>

        <aside id="tickets" className="lg:sticky lg:top-[86px] lg:self-start">
          <div className="relative border border-hairline bg-ground-alt">
            <div className="border-b border-hairline p-6">
              <SectionLabel index="01">Tiket</SectionLabel>
              <h2
                className={`${styles.display} mt-4 text-3xl uppercase leading-none text-ink`}
              >
                Pilih tiket<span className="text-amber">.</span>
              </h2>
              <p className="mt-3 text-xs leading-5 text-ink-secondary">
                Harga sudah termasuk akses acara sesuai jenis tiket.
              </p>
            </div>

            {event.ticketTypes.length ? (
              <div>
                {event.ticketTypes.map((ticketType, index) => {
                  const soldOut = ticketType.remainingQuota <= 0;

                  return (
                    <div
                      key={ticketType.id}
                      className="border-b border-hairline p-5 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className={`${styles.label} text-muted`}>
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <p className="mt-1 font-semibold text-ink">{ticketType.name}</p>
                          {ticketType.description ? (
                            <p className="mt-1 text-xs leading-5 text-ink-secondary">
                              {ticketType.description}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`${styles.label} shrink-0 border px-2.5 py-1 text-[9px] ${
                            soldOut
                              ? 'border-rose-500/25 bg-rose-500/10 text-rose-300'
                              : 'border-teal/35 bg-teal/10 text-teal-light'
                          }`}
                        >
                          {soldOut ? 'Habis' : `${ticketType.remainingQuota} tersisa`}
                        </span>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <p className={`${styles.display} text-2xl font-semibold text-ink`}>
                          {ticketType.price === 0 ? 'Gratis' : formatIdr(ticketType.price)}
                        </p>
                        <p className="text-[10px] text-muted">
                          Maks. {ticketType.maxPerOrder} / order
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border-b border-hairline p-5 text-sm text-ink-secondary">
                Tiket belum tersedia. Hubungi panitia untuk informasi lebih lanjut.
              </div>
            )}

            <div className="relative" aria-hidden="true">
              <div className="h-px bg-hairline" />
              <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ground" />
              <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ground" />
            </div>

            <div className="p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className={`${styles.label} text-muted`}>Tiket tersedia</p>
                  <p className={`${styles.display} mt-1 text-4xl font-semibold leading-none text-ink`}>
                    {totalRemaining}
                  </p>
                </div>
                <Ticket className="h-5 w-5 text-amber" aria-hidden="true" />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-muted">
                Kuota berubah mengikuti pemesanan yang masuk.
              </p>

              <div className="mt-5">
                <TicketClaim eventId={event.id} ticketTypes={event.ticketTypes} />
              </div>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
                E-ticket dan QR code dikirim otomatis ke email peserta. Pembayaran
                diverifikasi manual oleh panitia.
              </p>
            </div>
          </div>

          <div className="mt-4 border border-amber/20 bg-amber/10 p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold text-amber">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Pembayaran manual
            </p>
            <p className="mt-1.5 text-xs leading-5 text-ink-secondary">
              Setelah checkout, kamu akan mendapat instruksi transfer dan bisa mengunggah
              bukti pembayaran.
            </p>
          </div>
        </aside>
      </div>

      {relatedEvents.length ? (
        <section className="border-t border-hairline">
          <div className="container-editorial py-20 lg:py-28">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
              <SectionLabel index="03">Acara / Lainnya</SectionLabel>
              <Link
                href="/#events"
                className={`${styles.label} ml-auto inline-flex items-center gap-2 text-ink-secondary transition hover:text-amber`}
              >
                Semua acara
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              {relatedEvents.map((related) => (
                <EventTile key={related.id} event={related} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </EchoicPage>
  );
}
