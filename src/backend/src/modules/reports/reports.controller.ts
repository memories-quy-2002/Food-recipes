import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { ApiErrorResponseDto, ReviewReportResponseDto } from '../../common/swagger/response.schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateReviewReportDto } from './dto/create-review-report.dto';
import { ReportsService, ReportsServicePort } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateReviewReportDto } from './dto/update-review-report.dto';
import { ReviewReportQueryDto } from './dto/review-report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'recipes', version: '1' })
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly service: ReportsServicePort) {}

  @Post(':recipeId/reviews/:ratingId/report')
  @ApiOperation({ summary: 'Report a review for moderation' })
  @ApiCreatedResponse({ type: ReviewReportResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  create(@CurrentUser() user: AuthUser, @Param('recipeId', ParseIntPipe) recipeId: number, @Param('ratingId', ParseIntPipe) ratingId: number, @Body() dto: CreateReviewReportDto) {
    return this.service.create(user.id, recipeId, ratingId, dto);
  }
}

@ApiTags('Admin moderation')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller({ path: 'admin/review-reports', version: '1' })
export class AdminReportsController {
  constructor(@Inject(ReportsService) private readonly service: ReportsServicePort) {}

  @Get()
  @ApiOperation({ summary: 'List review reports for moderation' })
  list(@Query() query: ReviewReportQueryDto) {
    return this.service.list(query.status, query.page, query.limit);
  }

  @Patch(':reportId')
  @ApiOperation({ summary: 'Resolve or dismiss an open review report' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  resolve(@CurrentUser() user: AuthUser, @Param('reportId', ParseIntPipe) reportId: number, @Body() dto: UpdateReviewReportDto) {
    return this.service.resolve(reportId, user.id, dto);
  }
}
