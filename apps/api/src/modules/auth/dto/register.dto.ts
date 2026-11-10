import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Aulia Rahma' })
  @IsString()
  @Length(2, 80, { message: 'Nama harus 2–80 karakter' })
  name!: string;

  @ApiProperty({ example: 'aulia@example.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(72, { message: 'Password maksimal 72 karakter' })
  password!: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
