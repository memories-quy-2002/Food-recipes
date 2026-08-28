import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { type HouseholdRole } from '../household-access.service';

export const HOUSEHOLD_ROLES: readonly HouseholdRole[] = ['OWNER', 'MEMBER', 'VIEWER'];

export class UpdateHouseholdMemberDto {
  @ApiProperty({ enum: HOUSEHOLD_ROLES, example: 'MEMBER' })
  @IsIn(HOUSEHOLD_ROLES)
  role!: HouseholdRole;
}
