import { z } from 'zod';

export type Role = 'PARTICIPANT' | 'STAFF' | 'ADMIN';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'WAITING_VERIFICATION'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED';

export type TicketStatus = 'PENDING' | 'ACTIVE' | 'USED' | 'VOID';

export interface TicketSummary {
  ticketCode: string;
  qrToken: string;
  attendeeName: string;
  attendeeEmail: string | null;
  attendeePhone: string | null;
  status: TicketStatus;
  ticketTypeName: string;
  price: number;
  eventTitle: string;
  eventSlug: string;
  eventStartAt: string;
  eventEndAt: string;
  eventLocation: string;
}

export interface OrderSummary {
  orderCode: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  expiresAt: string;
  eventTitle: string;
  eventSlug: string;
  tickets: TicketSummary[];
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface TicketTypeSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quota: number;
  remainingQuota: number;
  maxPerOrder: number;
  isActive: boolean;
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  locationName: string;
  address: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  bannerUrl: string | null;
  status: EventStatus;
  paymentDeadlineHours: number;
  terms: string | null;
  ticketTypes: TicketTypeSummary[];
  minPrice: number | null;
}

export interface AuthResponse {
  user: PublicUser;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80, 'Nama terlalu panjang'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter'),
  phone: z.string().trim().max(20, 'Nomor telepon terlalu panjang').optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatIdr(amount: number): string {
  return idrFormatter.format(amount);
}

export function formatEventDate(startAt: string, endAt: string, timezone = 'Asia/Jakarta'): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  });
  const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });

  const sameDay = dateFormatter.format(start) === dateFormatter.format(end);
  if (sameDay) {
    return `${dateFormatter.format(start)}, ${timeFormatter.format(start)}–${timeFormatter.format(end)} WIB`;
  }
  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
}
