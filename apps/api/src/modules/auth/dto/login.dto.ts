import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'aulia@example.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MaxLength(72)
  password!: string;
}
