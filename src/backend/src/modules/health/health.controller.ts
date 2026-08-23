import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponseDto, HealthResponseDto } from '../../common/swagger/response.schemas';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@ApiInternalServerErrorResponse()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API and database readiness' })
  @ApiOkResponse({ description: 'API and database are ready', type: HealthResponseDto })
  @ApiResponse({ status: 503, description: 'Database is unavailable', type: ApiErrorResponseDto })
  getHealth(): Promise<{ status: 'ok' }> {
    return this.healthService.ready();
  }

  @Get('live')
  @ApiOperation({ summary: 'Check whether the API process is alive' })
  @ApiOkResponse({ description: 'API process is alive', type: HealthResponseDto })
  getLive(): { status: 'ok' } {
    return this.healthService.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check API and database readiness' })
  @ApiOkResponse({ description: 'API and database are ready', type: HealthResponseDto })
  @ApiResponse({ status: 503, description: 'Database is unavailable', type: ApiErrorResponseDto })
  getReady(): Promise<{ status: 'ok' }> {
    return this.healthService.ready();
  }
}
