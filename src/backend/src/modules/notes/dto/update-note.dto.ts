import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export const RECIPE_NOTE_MAX_LENGTH = 2000;

export class UpdateNoteDto {
  @ApiProperty({ example: 'Use half the salt next time.', maxLength: RECIPE_NOTE_MAX_LENGTH })
  @IsString()
  @MaxLength(RECIPE_NOTE_MAX_LENGTH)
  note!: string;
}
