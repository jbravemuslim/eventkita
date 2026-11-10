'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthResponse, OrderSummary, PublicEvent, PublicUser } from '@eventkita/shared';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  LogOut,
  Mail,
  ShieldCheck,
  Ticket,
  UserRound,
} from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { EchoicPage, SectionLabel } from '@/components/echoic/page';
import { EventTile } from '@/components/echoic/event-tile';
import { toLandingEvent } from '@/components/echoic/data';
import styles from '@/components/echoic/subpage.module.css';

const roleLabel: Record<PublicUser['role'], string> = {
  PARTICIPANT: 'Peserta',
  STAFF: 'Staff Check-in',
  ADMIN: 'Administrator',
};

const roleBadgeClass: Record<PublicUser['role'], string> = {
  PARTICIPANT: 'border-amber/30 bg-amber/10 text-amber',
  STAFF: 'border-teal/35 bg-teal/10 text-teal-light',
  ADMIN: 'border-ink/20 bg-white/5 text-ink',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<AuthResponse>('/api/auth/me');
      setUser(data.user);
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 401) {
        router.replace('/login?next=/dashboard');
        return;
      }
      setError('Tidak bisa memuat profil. Pastikan API berjalan, lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    let active = true;

    apiFetch<PublicEvent[]>('/api/events')
      .then((data) => {
        if (active) {
          setEvents(data.slice(0, 3));
        }
      })
      .catch(() => {
        if (active) {
          setEvents([]);
        }
      })
      .finally(() => {
        if (active) {
          setEventsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    apiFetch<OrderSummary[]>('/api/orders/mine')
      .then((data) => {
        if (active) {
          setOrders(data);
        }
      })
      .catch(() => {
        if (active) {
          setOrders([]);
        }
      })
      .finally(() => {
        if (active) {
          setOrdersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.dispatchEvent(new Event('eventkita:auth-change'));
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <EchoicPage>
        <div className="container-editorial py-14 sm:py-20">
          <SectionLabel>Portal / Memuat</SectionLabel>
          <div className="mt-8 h-24 w-3/4 max-w-2xl animate-pulse bg-white/5 sm:h-32" />
          <div className="mt-5 h-4 w-72 max-w-full animate-pulse bg-white/5" />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="aspect-[4/3] animate-pulse border border-hairline bg-ground-alt"
              />
            ))}
          </div>
        </div>
      </EchoicPage>
    );
  }

  if (error) {
    return (
      <EchoicPage>
        <div className="container-editorial flex min-h-[62vh] flex-col justify-center py-20">
          <SectionLabel index="Portal / 00">Koneksi terputus</SectionLabel>
          <h1
            className={`${styles.display} mt-6 max-w-3xl text-[clamp(44px,6vw,88px)] uppercase leading-[0.92] text-ink`}
          >
            Portal belum terbuka<span className="text-amber">.</span>
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 text-ink-secondary">{error}</p>
          <Button
            className="mt-8 w-fit rounded-none text-[10px] uppercase tracking-[0.12em]"
            onClick={() => void loadUser()}
          >
            Coba lagi
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </EchoicPage>
    );
  }

  if (!user) {
    return null;
  }

  const firstName = user.name.trim().split(/\s+/)[0] || 'Sahabat';
  const memberSince = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(user.createdAt));
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const upcomingEvents = events.map(toLandingEvent);

  const profileRows = [
    { label: 'Nama', value: user.name, icon: UserRound },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Role', value: roleLabel[user.role], icon: ShieldCheck },
    { label: 'Bergabung sejak', value: memberSince, icon: Clock },
  ];

  const foundationItems = [
    'Autentikasi cookie httpOnly',
    'Database PostgreSQL + Prisma',
    'Seed admin, staff, dan acara demo',
    'API health check',
  ];

  const nextSteps = [
    {
      title: 'Tiket saya',
      description:
        'Daftar tiket dan QR check-in akan muncul di sini setelah checkout tersedia.',
      phase: 'Fase 3',
      icon: Ticket,
    },
    {
      title: user.role === 'PARTICIPANT' ? 'Riwayat order' : 'Panel admin',
      description:
        user.role === 'PARTICIPANT'
          ? 'Order dan status pembayaran akan tampil di dashboard peserta.'
          : 'Verifikasi pembayaran, kelola acara, dan laporan akan tersedia di panel admin.',
      phase: user.role === 'PARTICIPANT' ? 'Fase 3' : 'Fase 4',
      icon: LayoutDashboard,
    },
    {
      title: 'Check-in QR',
      description:
        'Scanner kamera dan validasi tiket akan tersedia untuk staff di tahap berikutnya.',
      phase: 'Fase 4',
      icon: ShieldCheck,
    },
  ];

  return (
    <EchoicPage>
      <div className="container-editorial py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`${styles.label} inline-flex items-center gap-2.5 text-ink-secondary`}>
            <span className="h-1 w-1 rounded-full bg-amber" aria-hidden="true" />
            Portal / Anggota
          </span>
          <span className={`${styles.label} ml-auto text-muted`}>{today}</span>
        </div>

        <div className="mt-8 grid gap-10 border-b border-hairline pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span
              className={`${styles.label} inline-flex border px-3 py-1.5 ${roleBadgeClass[user.role]}`}
            >
              {roleLabel[user.role]}
            </span>
            <h1
              className={`${styles.display} mt-5 text-[clamp(48px,7vw,104px)] uppercase leading-[0.88] text-ink`}
            >
              Halo,
              <br />
              <span className="text-amber">{firstName}</span>
              <span className="text-teal-light">.</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-6 text-ink-secondary">
              Akun kamu aktif. Ini ruang untuk mengelola tiket, acara, dan momen yang akan
              datang.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <span className={`${styles.label} text-muted`}>Status akses</span>
            <span className={`${styles.label} inline-flex items-center gap-2 text-teal-light`}>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-light" aria-hidden="true" />
              Aktif
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                className="rounded-none text-[10px] uppercase tracking-[0.12em]"
              >
                <Link href="/#events">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Lihat acara
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-none text-[10px] uppercase tracking-[0.12em]"
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Keluar
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1.12fr_0.88fr]">
          <section>
            <SectionLabel index="01">Profil / Identitas</SectionLabel>
            <div className="mt-6">
              {profileRows.map((row, index) => {
                const Icon = row.icon;

                return (
                  <div
                    key={row.label}
                    className="grid gap-2 border-b border-hairline py-5 sm:grid-cols-[180px_1fr] sm:items-baseline"
                  >
                    <span className={`${styles.label} text-muted`}>
                      {String(index + 1).padStart(2, '0')} / {row.label}
                    </span>
                    <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                      <Icon className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
                      <span className="break-all">{row.value}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <SectionLabel index="02">Sistem / Fondasi</SectionLabel>
            <div className="mt-6 border border-hairline bg-ground-alt p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`${styles.label} text-muted`}>Status</p>
                  <p className={`${styles.display} mt-2 text-2xl uppercase leading-none text-ink`}>
                    Fondasi aktif<span className="text-amber">.</span>
                  </p>
                </div>
                <CheckCircle2 className="h-7 w-7 shrink-0 text-teal-light" aria-hidden="true" />
              </div>

              <div className="mt-6">
                {foundationItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 border-t border-hairline py-3 text-sm text-ink-secondary first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-light" aria-hidden="true" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-20 border-t border-hairline pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionLabel index="03">Acara / Mendatang</SectionLabel>
            <Link
              href="/#events"
              className={`${styles.label} ml-auto inline-flex items-center gap-2 text-ink-secondary transition hover:text-amber`}
            >
              Jelajahi semua
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8">
            {eventsLoading ? (
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="aspect-[4/3] animate-pulse border border-hairline bg-ground-alt"
                  />
                ))}
              </div>
            ) : upcomingEvents.length ? (
              <div className="grid gap-8 md:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <EventTile key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 border-y border-hairline py-8 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-lg text-sm leading-6 text-ink-secondary">
                  Belum ada acara mendatang di portal. Pantau terus atau mulai dari beranda.
                </p>
                <Link
                  href="/#events"
                  className={`${styles.label} inline-flex h-10 w-fit items-center gap-2 border border-ink px-5 text-ink transition hover:bg-ink hover:text-ground`}
                >
                  Buka acara
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="mt-20 border-t border-hairline pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionLabel index="04">Tiket / Saya</SectionLabel>
            <span className={`${styles.label} ml-auto text-muted`}>
              {orders.length} tiket
            </span>
          </div>

          <div className="mt-8">
            {ordersLoading ? (
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-44 animate-pulse border border-hairline bg-ground-alt"
                  />
                ))}
              </div>
            ) : orders.length ? (
              <div className="grid gap-6 md:grid-cols-3">
                {orders.flatMap((order) =>
                  order.tickets.map((ticket) => (
                    <Link
                      key={ticket.ticketCode}
                      href={`/tickets/${ticket.ticketCode}`}
                      className="group border border-hairline bg-ground-alt p-5 transition hover:border-amber"
                    >
                      <p className={`${styles.label} text-muted`}>{ticket.ticketTypeName}</p>
                      <p
                        className={`${styles.display} mt-2 text-xl uppercase leading-tight text-ink`}
                      >
                        {ticket.eventTitle}
                      </p>
                      <p className="mt-3 font-mono text-[11px] text-amber">
                        {ticket.ticketCode}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {new Intl.DateTimeFormat('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Jakarta',
                        }).format(new Date(ticket.eventStartAt))}
                      </p>
                      <span
                        className={`${styles.label} mt-4 inline-flex items-center gap-2 text-teal-light`}
                      >
                        Lihat e-ticket
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </Link>
                  )),
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4 border-y border-hairline py-8 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-lg text-sm leading-6 text-ink-secondary">
                  Belum ada tiket. Pilih acara di beranda untuk mengambil tiket pertamamu.
                </p>
                <Link
                  href="/#events"
                  className={`${styles.label} inline-flex h-10 w-fit items-center gap-2 border border-ink px-5 text-ink transition hover:bg-ink hover:text-ground`}
                >
                  Buka acara
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="mt-20 border-t border-hairline pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionLabel index="05">Rencana / Berikutnya</SectionLabel>
            <span className={`${styles.label} ml-auto text-amber`}>Fase 1 selesai</span>
          </div>

          <div className="mt-8 grid border-y border-hairline md:grid-cols-3">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="border-b border-hairline p-6 md:border-b-0 md:border-r md:last:border-r-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`${styles.display} ${styles.textStroke} text-5xl font-semibold leading-none`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`${styles.label} text-muted`}>{step.phase}</span>
                  </div>
                  <h3 className={`${styles.display} mt-8 text-2xl uppercase leading-none text-ink`}>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-ink-secondary">{step.description}</p>
                  <span className="mt-5 grid h-10 w-10 place-items-center border border-hairline text-teal-light">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-5 border border-amber/20 bg-amber/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`${styles.display} text-xl uppercase text-amber`}>Fase 1 selesai.</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-ink-secondary">
                Berikutnya: event & ticket type API, order, upload bukti, dan verifikasi
                pembayaran.
              </p>
            </div>
            <Button asChild className="w-fit rounded-none text-[10px] uppercase tracking-[0.12em]">
              <Link href="/#events">
                Jelajahi acara
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </EchoicPage>
  );
}
