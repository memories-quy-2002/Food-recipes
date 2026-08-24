import { PartialType } from '@nestjs/swagger';
import { CreateRecipeDto } from './create-recipe.dto';

export class CreateRecipeDraftDto extends PartialType(CreateRecipeDto) {}
