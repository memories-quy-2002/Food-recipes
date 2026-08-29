import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CreateRecipeDraftDto } from '../../recipes/dto/create-recipe-draft.dto';

export class PreviewRecipeImportDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;
}

export class SaveRecipeImportDto extends PartialType(CreateRecipeDraftDto) {
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  sourceUrl?: string;
}
