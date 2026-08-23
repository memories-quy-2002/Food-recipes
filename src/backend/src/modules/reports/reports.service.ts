import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewReportDto } from './dto/create-review-report.dto';
import { REPORTS_REPOSITORY, ReportsRepositoryPort, ReviewReportRecord } from './reports.repository';
import { UpdateReviewReportDto } from './dto/update-review-report.dto';

@Injectable()
export class ReportsService {
  constructor(@Inject(REPORTS_REPOSITORY) private readonly repository: ReportsRepositoryPort) {}

  async create(userId: number, recipeId: number, ratingId: number, dto: CreateReviewReportDto): Promise<{ report: ReviewReportRecord }> {
    if (!(await this.repository.ratingBelongsToRecipe(ratingId, recipeId))) {
      throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'Review not found for this recipe' });
    }
    if (await this.repository.openReportExists(ratingId, userId)) {
      throw new ConflictException({ code: 'REVIEW_REPORT_EXISTS', message: 'You have already reported this review' });
    }
    try {
      return { report: await this.repository.create(recipeId, ratingId, userId, dto.reason, dto.details?.trim() || null) };
    } catch (error) {
      if (String((error as { message?: string })?.message ?? error).includes('review_reports_open_report_key')) {
        throw new ConflictException({ code: 'REVIEW_REPORT_EXISTS', message: 'You have already reported this review' });
      }
      throw error;
    }
  }

  async list(status: string, page: number, limit: number) {
    const result = await this.repository.list(status, page, limit);
    return { ...result, page, limit, totalPages: Math.ceil(result.total / limit) };
  }

  async resolve(reportId: number, adminUserId: number, dto: UpdateReviewReportDto): Promise<{ report: ReviewReportRecord }> {
    const report = await this.repository.resolve(reportId, adminUserId, dto);
    if (!report) throw new NotFoundException({ code: 'REVIEW_REPORT_NOT_FOUND', message: 'Open review report not found' });
    return { report };
  }
}

export type ReportsServicePort = Pick<ReportsService, 'create' | 'list' | 'resolve'>;
