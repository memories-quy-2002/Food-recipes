import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateRecipeImageUploadDto } from './dto/create-recipe-image-upload.dto';
import { CreateJournalPhotoUploadDto } from './dto/create-journal-photo-upload.dto';
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

  @Post('journal-photo/upload-url')
  @ApiOperation({ summary: 'Create a short-lived cooking journal photo upload grant' })
  @ApiCreatedResponse({ description: 'Upload grant created', type: UploadGrantResponseDto })
  createJournalPhotoGrant(@CurrentUser() user: AuthUser, @Body() dto: CreateJournalPhotoUploadDto) {
    return this.service.createJournalPhotoGrant(user, dto);
  }
}
