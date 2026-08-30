import { Controller, Delete, Inject, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiErrorResponseDto, MessageResponseDto } from '../../common/swagger/response.schemas';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { NotInterestedService, NotInterestedServicePort } from './not-interested.service';

@ApiTags('Recommendations')
@ApiInternalServerErrorResponse()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/recommendations/not-interested', version: '1' })
export class NotInterestedController {
  constructor(@Inject(NotInterestedService) private readonly service: NotInterestedServicePort) {}

  @Put(':recipeId')
  @ApiOperation({ summary: 'Mark a published recipe as not interested' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe identifier' })
  @ApiOkResponse({ description: 'Recipe marked not interested', type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Published recipe was not found', type: ApiErrorResponseDto })
  add(@Param('recipeId', ParseIntPipe) recipeId: number, @CurrentUser() user: AuthUser) {
    return this.service.add(user.id, recipeId);
  }

  @Delete(':recipeId')
  @ApiOperation({ summary: 'Remove a recipe from not interested' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe identifier' })
  @ApiOkResponse({ description: 'Recipe removed from not interested', type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  remove(@Param('recipeId', ParseIntPipe) recipeId: number, @CurrentUser() user: AuthUser) {
    return this.service.remove(user.id, recipeId);
  }
}
