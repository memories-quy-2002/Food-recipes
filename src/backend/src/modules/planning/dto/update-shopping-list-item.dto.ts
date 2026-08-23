import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateShoppingListItemDto {
  @ApiPropertyOptional({ example: 'Cherry tomatoes', minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label?: string;

  @ApiPropertyOptional({ example: '1 kg', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  quantity?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  checked?: boolean;
}
