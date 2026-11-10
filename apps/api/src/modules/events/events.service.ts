import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PublicEvent, TicketTypeSummary } from '@eventkita/shared';
import { PrismaService } from '../../prisma/prisma.service';

type EventWithTicketTypes = Prisma.EventGetPayload<{
  include: {
    ticketTypes: true;
  };
}>;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(): Promise<PublicEvent[]> {
    const events = await this.prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        endAt: { gte: new Date() },
      },
      orderBy: { startAt: 'asc' },
      take: 50,
      include: {
        ticketTypes: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
        },
      },
    });

    return events.map((event) => this.toPublicEvent(event));
  }

  async getPublishedBySlug(slug: string): Promise<PublicEvent> {
    const event = await this.prisma.event.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        ticketTypes: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Acara tidak ditemukan atau belum dipublikasikan');
    }

    return this.toPublicEvent(event);
  }

  private toPublicEvent(event: EventWithTicketTypes): PublicEvent {
    const ticketTypes: TicketTypeSummary[] = event.ticketTypes.map((ticketType) => ({
      id: ticketType.id,
      name: ticketType.name,
      description: ticketType.description,
      price: ticketType.price,
      quota: ticketType.quota,
      remainingQuota: Math.max(0, ticketType.quota - ticketType.reservedCount),
      maxPerOrder: ticketType.maxPerOrder,
      isActive: ticketType.isActive,
    }));

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      category: event.category,
      locationName: event.locationName,
      address: event.address,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      timezone: event.timezone,
      bannerUrl: event.bannerUrl,
      status: event.status,
      paymentDeadlineHours: event.paymentDeadlineHours,
      terms: event.terms,
      ticketTypes,
      minPrice: ticketTypes.length
        ? Math.min(...ticketTypes.map((ticketType) => ticketType.price))
        : null,
    };
  }
}
