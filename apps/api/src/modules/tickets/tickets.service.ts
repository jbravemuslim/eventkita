import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByCode(code: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketCode: code },
      include: {
        ticketType: true,
        order: {
          include: {
            event: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Tiket tidak ditemukan');
    }

    return ticket;
  }

  async qrPng(code: string): Promise<Buffer> {
    const ticket = await this.getByCode(code);
    return QRCode.toBuffer(ticket.qrToken, {
      type: 'png',
      width: 480,
      margin: 1,
    });
  }

  async checkIn(code: string, staffId: string, note?: string) {
    const ticket = await this.getByCode(code);

    if (ticket.status === 'USED') {
      throw new ConflictException('Tiket sudah pernah dipakai untuk check-in');
    }
    if (ticket.status === 'VOID') {
      throw new ConflictException('Tiket sudah tidak berlaku');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'USED', checkedInAt: new Date() },
    });

    await this.prisma.checkIn.create({
      data: {
        ticketId: ticket.id,
        scannedById: staffId,
        method: 'QR',
        note: note ?? null,
      },
    });

    return updated;
  }
}
