import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { LandingEvent } from './data';
import { RemoteImage } from './remote-image';
import styles from './subpage.module.css';

export function EventTile({
  event,
  className = '',
}: {
  event: LandingEvent;
  className?: string;
}) {
  const content = (
    <div className="flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden border border-hairline bg-[radial-gradient(circle_at_30%_20%,rgba(46,107,114,0.28),transparent_55%),linear-gradient(135deg,#151a1f,#0a0c0e)]">
        <RemoteImage
          src={event.image}
          alt={event.alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover ${styles.imageMuted} transition duration-700 ease-out group-hover:scale-[1.035] group-hover:grayscale-0`}
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,0.04),rgba(10,12,14,0.5))]"
          aria-hidden="true"
        />
        <span
          className={`${styles.label} absolute left-3 top-3 border border-amber/30 bg-ground/70 px-2.5 py-1 text-[9px] text-amber backdrop-blur`}
        >
          {event.categoryCode} / {event.category}
        </span>
        <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-ink/25 bg-ground/55 text-ink backdrop-blur transition group-hover:border-amber group-hover:text-amber">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className={`${styles.label} text-teal-light`}>{event.date}</span>
        <span className={`${styles.label} text-right text-muted`}>{event.location}</span>
      </div>
      <h3
        className={`${styles.display} mt-2 flex-1 text-2xl uppercase leading-[1.05] text-ink transition-colors group-hover:text-amber`}
      >
        {event.title}
      </h3>
      <div className="mt-3 flex items-center justify-between gap-4 border-t border-hairline pt-3">
        <span className={`${styles.label} text-ink-secondary`}>{event.price}</span>
        <span className={`${styles.label} text-muted`}>Lihat acara</span>
      </div>
    </div>
  );

  if (event.slug) {
    return (
      <Link
        href={`/events/${event.slug}`}
        className={`group block h-full ${className}`.trim()}
        aria-label={`Lihat acara ${event.title}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`group block h-full ${className}`.trim()}>{content}</div>;
}
