import type { PublicEvent } from '@eventkita/shared';
import { formatIdr } from '@eventkita/shared';

export type LandingEvent = {
  id: string;
  slug: string | null;
  title: string;
  category: string;
  categoryCode: string;
  location: string;
  date: string;
  image: string;
  alt: string;
  price: string;
};

export type EventCategory = {
  code: string;
  name: string;
  count: number;
};

export const heroImage =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80';

export const driftImage =
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

const categoryImages: Record<string, string> = {
  Seminar: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  Workshop: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
  Musik: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
  Komunitas: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  Teknologi: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
  Olahraga: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
};

const defaultEventImage =
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80';

const defaultCategories: Omit<EventCategory, 'count'>[] = [
  { code: 'SEM', name: 'Seminar' },
  { code: 'WOR', name: 'Workshop' },
  { code: 'MUS', name: 'Musik' },
  { code: 'KOM', name: 'Komunitas' },
  { code: 'TEK', name: 'Teknologi' },
];

export const fallbackEvents: LandingEvent[] = [
  {
    id: 'fallback-seminar',
    slug: null,
    title: 'Seminar Teknologi Komunitas',
    category: 'Teknologi',
    categoryCode: 'TEK',
    location: 'Jakarta',
    date: '12 Des 2026',
    image: categoryImages.Teknologi,
    alt: 'Peserta seminar teknologi di ruang komunitas',
    price: 'Mulai Rp50.000',
  },
  {
    id: 'fallback-workshop',
    slug: null,
    title: 'Workshop Produk Digital',
    category: 'Workshop',
    categoryCode: 'WOR',
    location: 'Bandung',
    date: '21 Nov 2026',
    image: categoryImages.Workshop,
    alt: 'Peserta workshop berdiskusi di meja panjang',
    price: 'Mulai Rp75.000',
  },
  {
    id: 'fallback-musik',
    slug: null,
    title: 'Festival Musik Lokal',
    category: 'Musik',
    categoryCode: 'MUS',
    location: 'Yogyakarta',
    date: '5 Des 2026',
    image: categoryImages.Musik,
    alt: 'Penonton festival musik lokal',
    price: 'Mulai Rp100.000',
  },
];

function categoryCode(name: string) {
  const normalized = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalized.slice(0, 3).padEnd(3, 'X');
}

function categoryImage(name: string) {
  const exact = categoryImages[name];
  if (exact) {
    return exact;
  }

  const lower = name.toLowerCase();
  const match = Object.entries(categoryImages).find(([key]) => key.toLowerCase() === lower);
  return match?.[1] ?? defaultEventImage;
}

function shortDate(event: PublicEvent) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: event.timezone,
  }).format(new Date(event.startAt));
}

export function toLandingEvent(event: PublicEvent): LandingEvent {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    category: event.category,
    categoryCode: categoryCode(event.category),
    location: event.locationName,
    date: shortDate(event),
    image: event.bannerUrl ?? categoryImage(event.category),
    alt: `Banner acara ${event.title}`,
    price:
      event.minPrice === null
        ? 'Harga segera'
        : event.minPrice === 0
          ? 'Gratis'
          : `Mulai ${formatIdr(event.minPrice)}`,
  };
}

export function buildCategories(events: PublicEvent[]): EventCategory[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
  }

  const categories = [...defaultCategories];

  for (const event of events) {
    if (!categories.some((category) => category.name === event.category)) {
      categories.push({
        code: categoryCode(event.category),
        name: event.category,
      });
    }
  }

  return categories
    .slice(0, 5)
    .map((category) => ({ ...category, count: counts.get(category.name) ?? 0 }));
}
