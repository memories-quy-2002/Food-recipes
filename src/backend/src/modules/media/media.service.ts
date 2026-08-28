import { Injectable, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { createHmac, randomUUID } from 'node:crypto';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateRecipeImageUploadDto, RECIPE_IMAGE_MIME_TYPES, RECIPE_IMAGE_MAX_BYTES } from './dto/create-recipe-image-upload.dto';

@Injectable()
export class MediaService {
  async createRecipeImageGrant(user: AuthUser, dto: CreateRecipeImageUploadDto) {
    return this.createImageGrant(user, dto, 'recipes');
  }

  async createJournalPhotoGrant(user: AuthUser, dto: CreateRecipeImageUploadDto) {
    return this.createImageGrant(user, dto, 'journals');
  }

  private async createImageGrant(user: AuthUser, dto: CreateRecipeImageUploadDto, namespace: 'recipes' | 'journals') {
    if (!RECIPE_IMAGE_MIME_TYPES.includes(dto.contentType)) {
      throw new UnprocessableEntityException({ code: 'MEDIA_TYPE_NOT_ALLOWED', message: 'Only supported image MIME types may be uploaded' });
    }
    if (dto.size > RECIPE_IMAGE_MAX_BYTES) {
      throw new UnprocessableEntityException({ code: 'MEDIA_SIZE_EXCEEDED', message: 'Recipe images must be 5 MiB or smaller' });
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(dto.filename) || dto.filename.includes('..')) {
      throw new UnprocessableEntityException({ code: 'MEDIA_FILENAME_INVALID', message: 'Filename contains unsupported characters' });
    }

    const baseUrl = process.env.SUPABASE_UPLOAD_GRANT_BASE_URL?.trim();
    const signerSecret = process.env.SUPABASE_UPLOAD_GRANT_SECRET?.trim();
    if (!baseUrl || !signerSecret || signerSecret.length < 32) {
      throw new ServiceUnavailableException({ code: 'MEDIA_STORAGE_NOT_CONFIGURED', message: 'Image storage signing is not configured' });
    }

    const extension = dto.contentType.split('/')[1] === 'jpeg' ? 'jpg' : dto.contentType.split('/')[1];
    const objectPath = `${namespace}/${user.id}/${randomUUID()}.${extension}`;
    const expiresAt = Math.floor((Date.now() + 10 * 60 * 1000) / 1000);
    const payload = `${objectPath}|${expiresAt}|${dto.contentType}|${dto.size}`;
    const signature = createHmac('sha256', signerSecret).update(payload).digest('base64url');
    const uploadUrl = new URL(objectPath, `${baseUrl.replace(/\/$/, '')}/`);
    uploadUrl.searchParams.set('expires', String(expiresAt));
    uploadUrl.searchParams.set('contentType', dto.contentType);
    uploadUrl.searchParams.set('maxBytes', String(dto.size));
    uploadUrl.searchParams.set('signature', signature);
    return {
      uploadUrl: uploadUrl.toString(),
      objectPath,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      contentType: dto.contentType,
      maxBytes: RECIPE_IMAGE_MAX_BYTES,
    };
  }
}
