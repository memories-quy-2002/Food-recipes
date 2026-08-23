import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty({ description: 'JWT access token to resolve' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
