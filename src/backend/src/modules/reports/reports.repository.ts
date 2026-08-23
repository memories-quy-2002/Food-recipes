import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ReviewReportReason } from './dto/create-review-report.dto';
import { UpdateReviewReportDto } from './dto/update-review-report.dto';

export type ReviewReportRecord = {
  report_id: number;
  rating_id: number;
  recipe_id: number;
  reporter_user_id: number;
  reason: ReviewReportReason;
  details: string | null;
  status: string;
  created_at: Date;
};

export interface ReportsRepositoryPort {
  ratingBelongsToRecipe(ratingId: number, recipeId: number): Promise<boolean>;
  openReportExists(ratingId: number, reporterUserId: number): Promise<boolean>;
  create(recipeId: number, ratingId: number, reporterUserId: number, reason: ReviewReportReason, details: string | null): Promise<ReviewReportRecord>;
  list(status: string, page: number, limit: number): Promise<{ reports: ReviewReportRecord[]; total: number }>;
  resolve(reportId: number, adminUserId: number, dto: UpdateReviewReportDto): Promise<ReviewReportRecord | null>;
}

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');

@Injectable()
export class ReportsRepository implements ReportsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async ratingBelongsToRecipe(ratingId: number, recipeId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ rating_id: number }[]>(Prisma.sql`
      SELECT rating_id FROM rating WHERE rating_id = ${ratingId} AND recipe_id = ${recipeId}
    `);
    return rows.length > 0;
  }

  async openReportExists(ratingId: number, reporterUserId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ report_id: number }[]>(Prisma.sql`
      SELECT report_id FROM review_reports
      WHERE rating_id = ${ratingId} AND reporter_user_id = ${reporterUserId} AND status = 'open'
    `);
    return rows.length > 0;
  }

  async create(recipeId: number, ratingId: number, reporterUserId: number, reason: ReviewReportReason, details: string | null): Promise<ReviewReportRecord> {
    const rows = await this.prisma.$queryRaw<ReviewReportRecord[]>(Prisma.sql`
      INSERT INTO review_reports (rating_id, recipe_id, reporter_user_id, reason, details)
      VALUES (${ratingId}, ${recipeId}, ${reporterUserId}, ${reason}, ${details})
      RETURNING report_id, rating_id, recipe_id, reporter_user_id, reason, details, status, created_at
    `);
    return rows[0];
  }

  async list(status: string, page: number, limit: number): Promise<{ reports: ReviewReportRecord[]; total: number }> {
    const offset = (page - 1) * limit;
    const rows = await this.prisma.$queryRaw<ReviewReportRecord[]>(Prisma.sql`
      SELECT report_id, rating_id, recipe_id, reporter_user_id, reason, details, status, created_at
      FROM review_reports WHERE status = ${status}
      ORDER BY created_at ASC, report_id ASC LIMIT ${limit} OFFSET ${offset}
    `);
    const count = await this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`SELECT COUNT(*)::int AS total FROM review_reports WHERE status = ${status}`);
    return { reports: rows, total: Number(count[0]?.total ?? 0) };
  }

  async resolve(reportId: number, adminUserId: number, dto: UpdateReviewReportDto): Promise<ReviewReportRecord | null> {
    const rows = await this.prisma.$queryRaw<ReviewReportRecord[]>(Prisma.sql`
      UPDATE review_reports
      SET status = ${dto.status}, resolution_note = ${dto.note?.trim() || null}, resolved_at = CURRENT_TIMESTAMP, resolved_by = ${adminUserId}
      WHERE report_id = ${reportId} AND status = 'open'
      RETURNING report_id, rating_id, recipe_id, reporter_user_id, reason, details, status, created_at
    `);
    return rows[0] ?? null;
  }
}
