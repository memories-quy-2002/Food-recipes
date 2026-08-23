import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ReviewReportQueryDto {
  @ApiPropertyOptional({ enum: ['open', 'resolved', 'dismissed'], example: 'open' })
  @IsOptional()
  @IsIn(['open', 'resolved', 'dismissed'])
  status: 'open' | 'resolved' | 'dismissed' = 'open';

  @ApiPropertyOptional({ type: Number, minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
