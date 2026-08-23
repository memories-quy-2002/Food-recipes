import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { COLLECTION_NAME_MAX_LENGTH } from './create-collection.dto';

export class UpdateCollectionDto {
  @ApiProperty({ example: 'Weeknight dinners', minLength: 1, maxLength: COLLECTION_NAME_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(COLLECTION_NAME_MAX_LENGTH)
  name!: string;
}
