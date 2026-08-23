import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REVIEW_REPORT_REASONS = ['spam', 'abuse', 'unsafe', 'copyright', 'other'] as const;
export type ReviewReportReason = (typeof REVIEW_REPORT_REASONS)[number];

export class CreateReviewReportDto {
  @ApiProperty({ enum: REVIEW_REPORT_REASONS, example: 'spam' })
  @IsIn(REVIEW_REPORT_REASONS)
  reason!: ReviewReportReason;

  @ApiPropertyOptional({ maxLength: 1000, example: 'This review contains repeated promotional links.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
