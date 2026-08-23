import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
import {
  ApiErrorResponseDto,
  MessageResponseDto,
  PublicUserResponseDto,
} from '../../common/swagger/response.schemas';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiOkResponse({ description: 'Authenticated user profile', type: PublicUserResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Authenticated user was not found', type: ApiErrorResponseDto })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({ description: 'Updated user profile', type: PublicUserResponseDto })
  @ApiBadRequestResponse({ description: 'Profile input is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Authenticated user was not found', type: ApiErrorResponseDto })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Put('password')
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiOkResponse({ description: 'Password changed', type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Password input is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing, invalid, or current password is incorrect', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Authenticated user was not found', type: ApiErrorResponseDto })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.id, dto);
    return { message: 'Password updated successfully!' };
  }
}
