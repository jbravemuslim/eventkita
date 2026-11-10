'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderSummary } from '@eventkita/shared';
import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/api';
import { formatEventDate, formatIdr } from '@eventkita/shared';
import { Button } from '@/components/ui/button';
import { EchoicPage, SectionLabel } from '@/components/echoic/page';
import styles from '@/components/echoic/subpage.module.css';

interface TicketDetail {
  ticketCode: string;
  qrToken: string;
  attendeeName: string;
  status: string;
  ticketType: { name: string; price: number };
  order: {
    orderCode: string;
    status: string;
    event: {
      title: string;
      slug: string;
      startAt: string;
      endAt: string;
      locationName: string;
      address: string | null;
      timezone: string;
    };
  };
}

const statusLabel: Record<string, string> = {
  PENDING: 'Menunggu verifikasi',
  ACTIVE: 'Aktif',
  USED: 'Sudah digunakan',
  VOID: 'Tidak berlaku',
};

export default function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiFetch<TicketDetail>(`/api/tickets/${code}`)
      .then((data) => {
        if (active) {
          setTicket(data);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiClientError && caught.status === 401
              ? 'Silakan login untuk melihat tiket ini.'
              : 'Tiket tidak ditemukan.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [code]);

  return (
    <EchoicPage>
      <div className="container-editorial py-12 sm:py-16">
        <SectionLabel index="E-Ticket">Tiket / {code}</SectionLabel>

        {loading ? (
          <div className="mt-8 h-64 w-full max-w-xl animate-pulse bg-white/5" />
        ) : error || !ticket ? (
          <div className="mt-8 border border-hairline bg-ground-alt p-8">
            <h1 className={`${styles.display} text-3xl uppercase text-ink`}>
              Tiket tidak tersedia<span className="text-amber">.</span>
            </h1>
            <p className="mt-3 text-sm text-ink-secondary">{error}</p>
            <Button asChild className="mt-6 w-fit rounded-none text-[10px] uppercase tracking-[0.12em]">
              <Link href="/dashboard">
                Ke dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
            <div className="border border-hairline bg-ground-alt p-6 text-center">
              <p className={`${styles.label} text-muted`}>QR Code</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/tickets/${code}/qr.png`}
                alt={`QR code tiket ${code}`}
                width={280}
                height={280}
                className="mx-auto mt-4 bg-white p-3"
              />
              <p className={`${styles.display} mt-5 text-2xl tracking-[0.08em] text-ink`}>
                {ticket.ticketCode}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Tunjukkan QR ini kepada panitia saat check-in.
              </p>
            </div>

            <div className="min-w-0">
              <span
                className={`${styles.label} inline-flex border px-3 py-1.5 ${
                  ticket.status === 'ACTIVE'
                    ? 'border-teal/35 bg-teal/10 text-teal-light'
                    : 'border-amber/30 bg-amber/10 text-amber'
                }`}
              >
                {statusLabel[ticket.status] ?? ticket.status}
              </span>

              <h1 className={`${styles.display} mt-5 text-[clamp(34px,5vw,64px)] uppercase leading-[0.95] text-ink`}>
                {ticket.order.event.title}
              </h1>

              <dl className="mt-8 border-t border-hairline">
                <div className="grid gap-2 border-b border-hairline py-4 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className={`${styles.label} text-muted`}>Nama peserta</dt>
                  <dd className="text-sm text-ink">{ticket.attendeeName}</dd>
                </div>
                <div className="grid gap-2 border-b border-hairline py-4 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className={`${styles.label} text-muted`}>Jenis tiket</dt>
                  <dd className="text-sm text-ink">
                    {ticket.ticketType.name} ·{' '}
                    {ticket.ticketType.price === 0
                      ? 'Gratis'
                      : formatIdr(ticket.ticketType.price)}
                  </dd>
                </div>
                <div className="grid gap-2 border-b border-hairline py-4 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className={`${styles.label} text-muted`}>Waktu</dt>
                  <dd className="flex items-center gap-2 text-sm text-ink">
                    <CalendarDays className="h-4 w-4 text-amber" aria-hidden="true" />
                    {formatEventDate(
                      ticket.order.event.startAt,
                      ticket.order.event.endAt,
                      ticket.order.event.timezone,
                    )}
                  </dd>
                </div>
                <div className="grid gap-2 border-b border-hairline py-4 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className={`${styles.label} text-muted`}>Lokasi</dt>
                  <dd className="flex items-center gap-2 text-sm text-ink">
                    <MapPin className="h-4 w-4 text-amber" aria-hidden="true" />
                    {ticket.order.event.locationName}
                    {ticket.order.event.address
                      ? ` · ${ticket.order.event.address}`
                      : ''}
                  </dd>
                </div>
                <div className="grid gap-2 border-b border-hairline py-4 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className={`${styles.label} text-muted`}>Nomor pesanan</dt>
                  <dd className="font-mono text-sm text-ink">{ticket.order.orderCode}</dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-none text-[10px] uppercase tracking-[0.12em]">
                  <Link href="/dashboard">
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    Tiket saya
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none text-[10px] uppercase tracking-[0.12em]"
                >
                  <Link href={`/events/${ticket.order.event.slug}`}>
                    Lihat acara
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EchoicPage>
  );
}
