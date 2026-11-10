import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';

export interface TicketMailPayload {
  to: string;
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  locationName: string;
  ticketCode: string;
  ticketTypeName: string;
  qrToken: string;
  orderCode: string;
  amount: number;
  ticketUrl: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private getTransport(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST') ?? 'mailpit';
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? '1025');
    const user = this.configService.get<string>('SMTP_USER') ?? '';
    const pass = this.configService.get<string>('SMTP_PASS') ?? '';
    const secureSetting = this.configService.get<string>('SMTP_SECURE');
    const secure = secureSetting ? secureSetting === 'true' : port === 465;
    const rejectSetting = this.configService.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED');
    const rejectUnauthorized = rejectSetting ? rejectSetting === 'true' : true;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      // CA lab bersifat self-signed -> lab boleh menonaktifkan verifikasi.
      tls: { rejectUnauthorized },
    });

    return this.transporter;
  }

  async sendTicketEmail(payload: TicketMailPayload): Promise<boolean> {
    const subject = `E-ticket ${payload.eventTitle} — ${payload.ticketCode}`;
    const from =
      this.configService.get<string>('SMTP_FROM') ??
      'EventKita <no-reply@eventkita.local>';

    let qrPng: Buffer;
    try {
      qrPng = await QRCode.toBuffer(payload.qrToken, {
        type: 'png',
        width: 480,
        margin: 1,
      });
    } catch (error) {
      this.logger.error(`Gagal membuat QR untuk ${payload.ticketCode}: ${(error as Error).message}`);
      return false;
    }

    const html = `<!doctype html>
<html lang="id"><body style="margin:0;background:#0b0b0b;color:#e7e7ea;font-family:Segoe UI,Roboto,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px">
    <p style="letter-spacing:.18em;font-weight:700;color:#f4f4f5;margin:0 0 4px">EVENT<span style="color:#f59e0b">KITA</span>.</p>
    <p style="color:#a1a1aa;margin:0 0 24px;font-size:13px">Platform pendaftaran &amp; event ticketing komunitas</p>

    <div style="background:#111113;border:1px solid #27272a;border-radius:16px;padding:24px">
      <p style="margin:0 0 6px;color:#a1a1aa;font-size:13px">Halo ${payload.recipientName},</p>
      <h1 style="margin:0 0 18px;font-size:24px;line-height:1.2">E-ticket kamu sudah aktif</h1>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#a1a1aa">Acara</td><td style="padding:8px 0;text-align:right;font-weight:600">${payload.eventTitle}</td></tr>
        <tr><td style="padding:8px 0;color:#a1a1aa">Waktu</td><td style="padding:8px 0;text-align:right">${payload.eventDate}</td></tr>
        <tr><td style="padding:8px 0;color:#a1a1aa">Lokasi</td><td style="padding:8px 0;text-align:right">${payload.locationName}</td></tr>
        <tr><td style="padding:8px 0;color:#a1a1aa">Jenis tiket</td><td style="padding:8px 0;text-align:right">${payload.ticketTypeName}</td></tr>
        <tr><td style="padding:8px 0;color:#a1a1aa">Kode tiket</td><td style="padding:8px 0;text-align:right;font-family:Consolas,monospace;color:#f59e0b">${payload.ticketCode}</td></tr>
        <tr><td style="padding:8px 0;color:#a1a1aa">Nomor pesanan</td><td style="padding:8px 0;text-align:right;font-family:Consolas,monospace">${payload.orderCode}</td></tr>
      </table>

      <div style="text-align:center;margin:26px 0 8px">
        <img src="cid:qr-ticket" width="220" height="220" alt="QR Code tiket" />
      </div>
      <p style="text-align:center;color:#a1a1aa;font-size:13px;margin:0">
        Tunjukkan QR ini kepada panitia saat check-in.
      </p>

      <div style="text-align:center;margin-top:22px">
        <a href="${payload.ticketUrl}" style="display:inline-block;background:#f59e0b;color:#111113;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Lihat Tiket Online</a>
      </div>
    </div>

    <p style="color:#71717a;font-size:12px;margin-top:22px">
      Pembayaran diverifikasi manual oleh panitia. Jangan bagikan QR ini kepada orang lain.
    </p>
  </div>
</body></html>`;

    try {
      await this.getTransport().sendMail({
        from,
        to: payload.to,
        subject,
        html,
        attachments: [
          {
            filename: `e-ticket-${payload.ticketCode}.png`,
            content: qrPng,
            cid: 'qr-ticket',
          },
        ],
      });

      await this.prisma.emailLog.create({
        data: { to: payload.to, subject, template: 'ticket', status: 'SENT' },
      });
      this.logger.log(`E-ticket terkirim ke ${payload.to} (${payload.ticketCode})`);
      return true;
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`Gagal mengirim e-ticket ke ${payload.to}: ${message}`);
      await this.prisma.emailLog
        .create({
          data: {
            to: payload.to,
            subject,
            template: 'ticket',
            status: 'FAILED',
            error: message,
          },
        })
        .catch(() => undefined);
      return false;
    }
  }
}
