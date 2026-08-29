import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { UpdateFoodPreferencesDto } from './dto/update-food-preferences.dto';
import { PreferencesService, PreferencesServicePort } from './preferences.service';

@ApiTags('Preferences')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/food-preferences', version: '1' })
export class PreferencesController {
  constructor(@Inject(PreferencesService) private readonly service: PreferencesServicePort) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user food preferences' })
  @ApiOkResponse({ description: 'Food preferences' })
  get(@CurrentUser() user: AuthUser) {
    return this.service.get(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Replace the authenticated user food preferences' })
  @ApiOkResponse({ description: 'Food preferences replaced' })
  replace(@CurrentUser() user: AuthUser, @Body() dto: UpdateFoodPreferencesDto) {
    return this.service.replace(user.id, dto);
  }
}
