import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':code')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Detail tiket (termasuk QR token)' })
  async detail(@Param('code') code: string) {
    return this.ticketsService.getByCode(code);
  }

  @Get(':code/qr.png')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @Header('Content-Type', 'image/png')
  @ApiOperation({ summary: 'Gambar QR code tiket' })
  async qr(@Param('code') code: string): Promise<Buffer> {
    return this.ticketsService.qrPng(code);
  }

  @Post(':code/checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Check-in tiket oleh panitia (scan QR)' })
  async checkIn(
    @Param('code') code: string,
    @CurrentUser() user: AuthUser,
    @Body('note') note?: string,
  ) {
    return this.ticketsService.checkIn(code, user.id, note);
  }
}
