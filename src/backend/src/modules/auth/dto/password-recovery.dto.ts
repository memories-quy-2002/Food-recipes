import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class PasswordRecoveryDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;

  @ApiProperty({ description: 'Single-use recovery token' })
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Single-use email verification token' })
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;
}
