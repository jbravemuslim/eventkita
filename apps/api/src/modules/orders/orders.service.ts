import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'node:crypto';
import type { OrderSummary, TicketSummary } from '@eventkita/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import type { CreateOrderDto } from './dto/create-order.dto';

function randomCode(length = 8): string {
  return randomBytes(length)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, length)
    .padEnd(length, 'X');
}

function formatDate(value: Date, timezone = 'Asia/Jakarta'): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(value);
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { ticketTypes: true },
    });
    if (!event) {
      throw new NotFoundException('Acara tidak ditemukan');
    }
    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('Pendaftaran acara ini belum dibuka');
    }

    const requested = dto.items.filter((item) => item.quantity > 0);
    if (!requested.length) {
      throw new BadRequestException('Pilih minimal satu tiket');
    }

    let totalAmount = 0;
    const resolved: { ticketType: (typeof event.ticketTypes)[number]; quantity: number }[] = [];

    for (const item of requested) {
      const ticketType = event.ticketTypes.find((tt) => tt.id === item.ticketTypeId);
      if (!ticketType) {
        throw new BadRequestException('Jenis tiket tidak valid untuk acara ini');
      }
      if (!ticketType.isActive) {
        throw new BadRequestException(`Jenis tiket "${ticketType.name}" sedang tidak tersedia`);
      }
      if (item.quantity > ticketType.maxPerOrder) {
        throw new BadRequestException(
          `Maksimal ${ticketType.maxPerOrder} tiket per pemesanan untuk "${ticketType.name}"`,
        );
      }
      const remaining = ticketType.quota - ticketType.reservedCount;
      if (item.quantity > remaining) {
        throw new BadRequestException(
          `Kuota "${ticketType.name}" tersisa ${remaining} tiket`,
        );
      }
      totalAmount += ticketType.price * item.quantity;
      resolved.push({ ticketType, quantity: item.quantity });
    }

    const orderCode = `EVT-${randomCode(8)}`;
    const expiresAt = new Date(
      Date.now() + event.paymentDeadlineHours * 60 * 60 * 1000,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderCode,
          userId: user.id,
          eventId: event.id,
          status: 'PENDING_PAYMENT',
          totalAmount,
          expiresAt,
          items: {
            create: resolved.map((entry) => ({
              ticketTypeId: entry.ticketType.id,
              quantity: entry.quantity,
              unitPrice: entry.ticketType.price,
              subtotal: entry.ticketType.price * entry.quantity,
            })),
          },
        },
      });

      for (const entry of resolved) {
        await tx.ticketType.update({
          where: { id: entry.ticketType.id },
          data: { reservedCount: { increment: entry.quantity } },
        });

        for (let index = 0; index < entry.quantity; index += 1) {
          await tx.ticket.create({
            data: {
              ticketCode: `TKT-${randomCode(10)}`,
              qrToken: randomUUID(),
              orderId: created.id,
              ticketTypeId: entry.ticketType.id,
              attendeeName: user.name,
              attendeeEmail: user.email,
              attendeePhone: user.phone,
              status: 'PENDING',
            },
          });
        }
      }

      return created;
    });

    const tickets = await this.prisma.ticket.findMany({
      where: { orderId: order.id },
      include: { ticketType: true },
    });

    const baseUrl = (
      this.configService.get<string>('APP_ORIGIN') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');

    for (const ticket of tickets) {
      await this.mailer.sendTicketEmail({
        to: user.email,
        recipientName: user.name,
        eventTitle: event.title,
        eventDate: formatDate(event.startAt, event.timezone),
        locationName: event.locationName,
        ticketCode: ticket.ticketCode,
        ticketTypeName: ticket.ticketType.name,
        qrToken: ticket.qrToken,
        orderCode: order.orderCode,
        amount: ticket.ticketType.price,
        ticketUrl: `${baseUrl}/tickets/${ticket.ticketCode}`,
      });
    }

    return this.toSummary(order, tickets, event);
  }

  async listMine(userId: string): Promise<OrderSummary[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: true,
        tickets: { include: { ticketType: true } },
      },
    });

    return orders.map((order) => this.toSummary(order, order.tickets, order.event));
  }

  async approve(orderCode: string, staffId: string, note?: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: { tickets: true },
    });
    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }
    if (order.status === 'PAID') {
      return order;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const paid = await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date(), paymentNote: note ?? null },
      });
      await tx.ticket.updateMany({
        where: { orderId: order.id },
        data: { status: 'ACTIVE' },
      });
      await tx.paymentEvent.create({
        data: {
          orderId: order.id,
          action: 'APPROVED',
          actorId: staffId,
          note: note ?? null,
        },
      });
      return paid;
    });

    return updated;
  }

  async reject(orderCode: string, staffId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: { tickets: { include: { ticketType: true } } },
    });
    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const rejected = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', rejectionReason: reason ?? null },
      });
      await tx.ticket.updateMany({
        where: { orderId: order.id },
        data: { status: 'VOID' },
      });
      for (const ticket of order.tickets) {
        await tx.ticketType.update({
          where: { id: ticket.ticketTypeId },
          data: { reservedCount: { decrement: 1 } },
        });
      }
      await tx.paymentEvent.create({
        data: {
          orderId: order.id,
          action: 'REJECTED',
          actorId: staffId,
          note: reason ?? null,
        },
      });
      return rejected;
    });

    return updated;
  }

  private toSummary(
    order: { id: string; orderCode: string; status: string; totalAmount: number; createdAt: Date; expiresAt: Date },
    tickets: { ticketCode: string; qrToken: string; attendeeName: string; attendeeEmail: string | null; attendeePhone: string | null; status: string; ticketType: { name: string; price: number } }[],
    event: { title: string; slug: string; startAt: Date; endAt: Date; locationName: string; timezone: string },
  ): OrderSummary {
    const ticketSummaries: TicketSummary[] = tickets.map((ticket) => ({
      ticketCode: ticket.ticketCode,
      qrToken: ticket.qrToken,
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      attendeePhone: ticket.attendeePhone,
      status: ticket.status as TicketSummary['status'],
      ticketTypeName: ticket.ticketType.name,
      price: ticket.ticketType.price,
      eventTitle: event.title,
      eventSlug: event.slug,
      eventStartAt: event.startAt.toISOString(),
      eventEndAt: event.endAt.toISOString(),
      eventLocation: event.locationName,
    }));

    return {
      orderCode: order.orderCode,
      status: order.status as OrderSummary['status'],
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      eventTitle: event.title,
      eventSlug: event.slug,
      tickets: ticketSummaries,
    };
  }
}
