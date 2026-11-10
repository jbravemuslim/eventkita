import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Buat pesanan + generate tiket & QR otomatis' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Daftar pesanan & tiket milik saya' })
  mine(@CurrentUser() user: AuthUser) {
    return this.ordersService.listMine(user.id);
  }

  @Post(':orderCode/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Panitia menyetujui pembayaran (verifikasi manual)' })
  approve(
    @Param('orderCode') orderCode: string,
    @CurrentUser() user: AuthUser,
    @Body('note') note?: string,
  ) {
    return this.ordersService.approve(orderCode, user.id, note);
  }

  @Post(':orderCode/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Panitia menolak pembayaran' })
  reject(
    @Param('orderCode') orderCode: string,
    @CurrentUser() user: AuthUser,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.reject(orderCode, user.id, reason);
  }
}
