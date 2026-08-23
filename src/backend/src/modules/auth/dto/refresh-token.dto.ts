import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Optional backend-client fallback; browsers use the HttpOnly cookie.' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  refreshToken?: string;
}
