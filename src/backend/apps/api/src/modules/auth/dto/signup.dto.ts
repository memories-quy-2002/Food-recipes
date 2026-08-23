import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength, ValidateNested } from 'class-validator';

export class SignupNameDto {
  @ApiProperty({ example: 'Ada' })
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  first!: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  last!: string;
}

export class SignupDto {
  @ApiProperty({ type: SignupNameDto })
  @ValidateNested()
  @Type(() => SignupNameDto)
  name!: SignupNameDto;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
