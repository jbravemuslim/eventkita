import Link from 'next/link';
import type { PublicEvent } from '@eventkita/shared';
import { formatEventDate, formatIdr } from '@eventkita/shared';
import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

export function EventCard({ event }: { event: PublicEvent }) {
  const totalRemaining = event.ticketTypes.reduce(
    (total, ticketType) => total + ticketType.remainingQuota,
    0,
  );

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-amber/40">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-amber/35 via-teal/35 to-ground">
        {event.bannerUrl ? (
          // Banner eksternal; sengaja pakai img agar tidak perlu konfigurasi domain remote.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.bannerUrl}
            alt=""
            className="h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-90"
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/10" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-5xl font-black tracking-tight text-white/25">
                {event.category.slice(0, 1).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <Badge className="absolute left-4 top-4 border-amber/30 bg-ground/70 text-amber backdrop-blur">
          {event.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug tracking-tight text-ink">
          <Link href={`/events/${event.slug}`} className="transition hover:text-amber">
            {event.title}
          </Link>
        </h3>

        <div className="mt-3 space-y-2 text-sm text-ink-secondary">
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
            <span>{formatEventDate(event.startAt, event.endAt, event.timezone)}</span>
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
            <span>{event.locationName}</span>
          </p>
          <p className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
            <span>{totalRemaining > 0 ? `${totalRemaining} tiket tersedia` : 'Tiket habis'}</span>
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Mulai dari</p>
            <p className="mt-1 text-lg font-extrabold text-ink">
              {event.minPrice === null
                ? '—'
                : event.minPrice === 0
                  ? 'Gratis'
                  : formatIdr(event.minPrice)}
            </p>
          </div>
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/5 px-3.5 py-2 text-sm font-semibold text-amber transition hover:border-amber/40 hover:bg-white/10"
          >
            Detail
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
