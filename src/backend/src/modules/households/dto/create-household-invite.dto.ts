import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateHouseholdInviteDto {
  @ApiProperty({ example: 'cook@example.com' })
  @IsEmail()
  email!: string;
}
