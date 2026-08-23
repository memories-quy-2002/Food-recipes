import { PartialType } from '@nestjs/swagger';
import { AddMealPlanItemDto } from './add-meal-plan-item.dto';

export class UpdateMealPlanItemDto extends PartialType(AddMealPlanItemDto) {}
