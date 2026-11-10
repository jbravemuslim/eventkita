'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthResponse, OrderSummary, PublicEvent, PublicUser } from '@eventkita/shared';
import { ArrowRight, Loader2, Ticket } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import styles from '@/components/echoic/subpage.module.css';

type TicketType = PublicEvent['ticketTypes'][number];

interface TicketClaimProps {
  eventId: string;
  ticketTypes: TicketType[];
}

export function TicketClaim({ eventId, ticketTypes }: TicketClaimProps) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(ticketTypes[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiFetch<AuthResponse>('/api/auth/me')
      .then((data) => {
        if (active) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedType = useMemo(
    () => ticketTypes.find((item) => item.id === selectedId),
    [selectedId, ticketTypes],
  );

  const maxQty = Math.min(
    selectedType?.maxPerOrder ?? 1,
    selectedType?.remainingQuota ?? 1,
  );

  async function submitOrder() {
    if (!selectedType) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const order = await apiFetch<OrderSummary>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          items: [{ ticketTypeId: selectedType.id, quantity }],
        }),
      });

      const firstTicket = order.tickets[0];
      if (firstTicket) {
        router.push(`/tickets/${firstTicket.ticketCode}`);
      } else {
        setError('Pesanan dibuat, tetapi tiket belum tersedia. Hubungi panitia.');
      }
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        setError(
          Array.isArray(caught.details)
            ? caught.details[0]
            : caught.details ?? caught.message,
        );
      } else {
        setError('Pemesanan gagal. Coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!checked) {
    return (
      <div className="mt-5 space-y-2.5">
        <div className="h-14 w-full animate-pulse bg-white/5" />
        <div className="h-11 w-full animate-pulse bg-white/5" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-5 space-y-2.5">
        <Link
          href="/login"
          className={`${styles.label} flex h-14 items-center justify-center gap-2 bg-amber px-5 text-[10px] text-ground transition hover:bg-amber-strong`}
        >
          Masuk untuk memesan
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link
          href="/register"
          className={`${styles.label} flex h-11 items-center justify-center border border-hairline px-5 text-[10px] text-ink-secondary transition hover:border-amber hover:text-amber`}
        >
          Belum punya akun? Daftar
        </Link>
      </div>
    );
  }

  if (!ticketTypes.length) {
    return (
      <p className="mt-5 text-[11px] leading-relaxed text-muted">
        Tiket belum tersedia untuk acara ini.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <fieldset className="space-y-3">
        <legend className={`${styles.label} text-muted`}>Jenis tiket</legend>
        {ticketTypes.map((ticketType) => {
          const soldOut = ticketType.remainingQuota <= 0;
          const active = ticketType.id === selectedId;

          return (
            <label
              key={ticketType.id}
              className={`flex cursor-pointer items-start gap-3 border p-3 transition ${
                active
                  ? 'border-amber bg-amber/10'
                  : 'border-hairline hover:border-amber/50'
              } ${soldOut ? 'opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="ticketType"
                value={ticketType.id}
                checked={active}
                disabled={soldOut}
                onChange={() => {
                  setSelectedId(ticketType.id);
                  setQuantity(1);
                }}
                className="mt-1 accent-[#e8913c]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {ticketType.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {soldOut
                    ? 'Habis'
                    : `${ticketType.remainingQuota} tersisa · maks ${ticketType.maxPerOrder} / order`}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className={`${styles.label} text-muted`}>Jumlah</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className={`${styles.label} h-9 w-9 border border-hairline text-ink transition hover:border-amber hover:text-amber`}
          >
            −
          </button>
          <span className={`${styles.display} w-8 text-center text-xl text-ink`}>
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Tambah jumlah"
            onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
            className={`${styles.label} h-9 w-9 border border-hairline text-ink transition hover:border-amber hover:text-amber`}
          >
            +
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-5 h-14 w-full rounded-none text-[10px] uppercase tracking-[0.12em]"
        disabled={submitting || !selectedType}
        onClick={() => void submitOrder()}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Ticket className="h-4 w-4" aria-hidden="true" />
        )}
        {submitting ? 'Memproses…' : 'Pesan & kirim e-ticket'}
      </Button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
        E-ticket + QR code dikirim otomatis ke email {user.email}. Pembayaran diverifikasi
        manual oleh panitia.
      </p>
    </div>
  );
}
