import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Prisma, Role } from '@prisma/client';
import type { PublicUser } from '@eventkita/shared';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type SelectedUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser; token: string }> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar. Silakan login.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        phone: dto.phone?.trim() || null,
        role: 'PARTICIPANT',
      },
      select: publicUserSelect,
    });

    return {
      user: this.toPublicUser(user),
      token: await this.signToken(user),
    };
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser; token: string }> {
    const email = dto.email.trim().toLowerCase();
    const record = await this.prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });

    if (!record) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const passwordMatches = await bcrypt.compare(dto.password, record.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const { passwordHash: _passwordHash, ...user } = record;

    return {
      user: this.toPublicUser(user),
      token: await this.signToken(user),
    };
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Sesi tidak valid');
    }

    return this.toPublicUser(user);
  }

  private async signToken(user: SelectedUser): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private toPublicUser(user: SelectedUser): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
