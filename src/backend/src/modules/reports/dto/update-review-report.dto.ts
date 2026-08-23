import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REVIEW_REPORT_RESOLUTIONS = ['resolved', 'dismissed'] as const;

export class UpdateReviewReportDto {
  @ApiProperty({ enum: REVIEW_REPORT_RESOLUTIONS, example: 'resolved' })
  @IsIn(REVIEW_REPORT_RESOLUTIONS)
  status!: (typeof REVIEW_REPORT_RESOLUTIONS)[number];

  @ApiPropertyOptional({ maxLength: 1000, example: 'Reviewed and removed the abusive content.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
