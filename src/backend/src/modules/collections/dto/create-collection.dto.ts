import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export const COLLECTION_NAME_MAX_LENGTH = 80;

export class CreateCollectionDto {
  @ApiProperty({ example: 'Weeknight dinners', minLength: 1, maxLength: COLLECTION_NAME_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(COLLECTION_NAME_MAX_LENGTH)
  name!: string;
}
