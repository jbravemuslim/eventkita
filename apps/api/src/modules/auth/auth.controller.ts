import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthResponse } from '@eventkita/shared';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Daftar sebagai peserta baru' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);
    this.setSessionCookie(response, result.token);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login dengan email dan password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto);
    this.setSessionCookie(response, result.token);
    return { user: result.user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Ambil profil user yang sedang login' })
  async me(@CurrentUser() user: AuthUser): Promise<AuthResponse> {
    return { user: await this.authService.getCurrentUser(user.id) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus sesi login' })
  logout(@Res({ passthrough: true }) response: Response): { ok: boolean } {
    const cookieName = this.configService.get<string>('COOKIE_NAME') ?? 'eventkita_session';
    response.clearCookie(cookieName, { path: '/' });
    return { ok: true };
  }

  private setSessionCookie(response: Response, token: string): void {
    const cookieName = this.configService.get<string>('COOKIE_NAME') ?? 'eventkita_session';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const secureSetting = this.configService.get<string>('COOKIE_SECURE');
    const secureCookie = secureSetting ? secureSetting === 'true' : isProduction;

    response.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookie,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
