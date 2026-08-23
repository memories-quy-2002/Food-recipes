import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const originalBaseUrl = process.env.SUPABASE_UPLOAD_GRANT_BASE_URL;
  const originalSecret = process.env.SUPABASE_UPLOAD_GRANT_SECRET;

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.SUPABASE_UPLOAD_GRANT_BASE_URL;
    else process.env.SUPABASE_UPLOAD_GRANT_BASE_URL = originalBaseUrl;
    if (originalSecret === undefined) delete process.env.SUPABASE_UPLOAD_GRANT_SECRET;
    else process.env.SUPABASE_UPLOAD_GRANT_SECRET = originalSecret;
  });

  it('rejects unsafe filenames before storage configuration is checked', async () => {
    await expect(new MediaService().createRecipeImageGrant({ id: 7, email: 'ada@example.com' }, { filename: '../secret', contentType: 'image/png', size: 10 })).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('does not pretend to issue a grant when storage signing is absent', async () => {
    delete process.env.SUPABASE_UPLOAD_GRANT_BASE_URL;
    await expect(new MediaService().createRecipeImageGrant({ id: 7, email: 'ada@example.com' }, { filename: 'recipe.png', contentType: 'image/png', size: 10 })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('returns a short-lived object path when a signer base is configured', async () => {
    process.env.SUPABASE_UPLOAD_GRANT_BASE_URL = 'https://uploads.example/sign';
    process.env.SUPABASE_UPLOAD_GRANT_SECRET = 'a'.repeat(32);
    const result = await new MediaService().createRecipeImageGrant({ id: 7, email: 'ada@example.com' }, { filename: 'recipe.png', contentType: 'image/png', size: 10 });

    expect(result.objectPath).toMatch(/^recipes\/7\//);
    expect(result.uploadUrl).toMatch(/^https:\/\/uploads\.example\/sign\/recipes\/7\/.*\?expires=/);
    expect(result.uploadUrl).toContain('signature=');
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});
