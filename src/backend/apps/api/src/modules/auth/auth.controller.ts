import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenDto } from './dto/token.dto';
import { AuthUser } from './types/auth-user.type';
import {
  ApiErrorResponseDto,
  AuthResponseDto,
  PublicUserResponseDto,
} from '../../common/swagger/response.schemas';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an account' })
  @ApiCreatedResponse({ description: 'Account created', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid signup data', type: ApiErrorResponseDto })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ description: 'Authenticated successfully', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid login data', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Credentials are invalid', type: ApiErrorResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated account' })
  @ApiOkResponse({ description: 'Authenticated account', type: PublicUserResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a legacy JWT body token' })
  @ApiOkResponse({ description: 'Token resolved to a user', type: PublicUserResponseDto })
  @ApiBadRequestResponse({ description: 'Token is missing or malformed', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT is invalid or expired', type: ApiErrorResponseDto })
  token(@Body() dto: TokenDto) {
    if (!dto.token) {
      throw new BadRequestException({
        code: 'TOKEN_REQUIRED',
        message: 'Token is required',
      });
    }
    return this.authService.getUserFromToken(dto.token);
  }
}
