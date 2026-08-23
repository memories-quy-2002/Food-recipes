import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateRecipeImageUploadDto } from './dto/create-recipe-image-upload.dto';
import { MediaService } from './media.service';
import { UploadGrantResponseDto } from '../../common/swagger/response.schemas';

@ApiTags('Media')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(@Inject(MediaService) private readonly service: MediaService) {}

  @Post('recipe-image/upload-url')
  @ApiOperation({ summary: 'Create a short-lived recipe image upload grant' })
  @ApiCreatedResponse({ description: 'Upload grant created', type: UploadGrantResponseDto })
  createRecipeImageGrant(@CurrentUser() user: AuthUser, @Body() dto: CreateRecipeImageUploadDto) {
    return this.service.createRecipeImageGrant(user, dto);
  }
}
