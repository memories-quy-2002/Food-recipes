import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
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
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PasswordRecoveryDto, ResetPasswordDto, VerifyEmailDto } from './dto/password-recovery.dto';
import { AuthThrottleGuard } from '../../common/security/auth-throttle.guard';
import { AuthThrottleService } from '../../common/security/auth-throttle.service';
import { AuthUser } from './types/auth-user.type';
import {
  ApiErrorResponseDto,
  AuthResponseDto,
  PublicUserResponseDto,
} from '../../common/swagger/response.schemas';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';

@ApiTags('Auth')
@ApiInternalServerErrorResponse()
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly throttle: AuthThrottleService) {}

  @Post('signup')
  @UseGuards(AuthThrottleGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an account' })
  @ApiCreatedResponse({ description: 'Account created', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid signup data', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email is already registered', type: ApiErrorResponseDto })
  async signup(@Body() dto: SignupDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const result = await this.authService.signup(dto);
      this.setRefreshCookie(response, result.refreshToken);
      return this.publicAuthResponse(result);
    } catch (error) {
      this.throttle.recordFailure(this.clientIp(request), dto.email);
      throw error;
    }
  }

  @Post('login')
  @UseGuards(AuthThrottleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ description: 'Authenticated successfully', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid login data', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Credentials are invalid', type: ApiErrorResponseDto })
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const result = await this.authService.login(dto);
      this.throttle.recordSuccess(this.clientIp(request), dto.email);
      this.setRefreshCookie(response, result.refreshToken);
      return this.publicAuthResponse(result);
    } catch (error) {
      this.throttle.recordFailure(this.clientIp(request), dto.email);
      throw error;
    }
  }

  @Post('refresh')
  @UseGuards(AuthThrottleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the HttpOnly refresh session and issue a short-lived access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@Body() dto: RefreshTokenDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = dto.refreshToken ?? this.readCookie(request, 'food_refresh');
    if (!refreshToken) throw new UnauthorizedException({ code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token is required' });
    try {
      const result = await this.authService.refresh(refreshToken);
      this.throttle.recordSuccess(this.clientIp(request));
      this.setRefreshCookie(response, result.refreshToken);
      return this.publicAuthResponse(result);
    } catch (error) {
      this.throttle.recordFailure(this.clientIp(request));
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.authService.logout(this.readCookie(request, 'food_refresh')).then(() => {
      response.clearCookie('food_refresh', { httpOnly: true, sameSite: 'lax', path: '/api/v1/auth' });
      return { message: 'Logged out successfully.' };
    });
  }

  @Post('forgot-password')
  @UseGuards(AuthThrottleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request generic password recovery instructions' })
  async forgotPassword(@Body() dto: PasswordRecoveryDto, @Req() request: Request) {
    try {
      const result = await this.authService.forgotPassword(dto);
      this.throttle.recordSuccess(this.clientIp(request), dto.email);
      return result;
    } catch (error) {
      this.throttle.recordFailure(this.clientIp(request), dto.email);
      throw error;
    }
  }

  @Post('reset-password')
  @UseGuards(AuthThrottleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consume a password recovery token' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    try {
      const result = await this.authService.resetPassword(dto);
      this.throttle.recordSuccess(this.clientIp(request));
      return result;
    } catch (error) {
      this.throttle.recordFailure(this.clientIp(request));
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consume a single-use email verification token' })
  @UseGuards(AuthThrottleGuard)
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() request: Request) {
    try {
      const result = await this.authService.verifyEmail(dto);
      this.throttle.recordSuccess(this.clientIp(request));
      return result;
    } catch (error) {
      this.throttle.recordFailure(this.clientIp(request));
      throw error;
    }
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a new email verification message' })
  resendVerification(@CurrentUser() user: AuthUser) { return this.authService.resendVerification(user.id); }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated account' })
  @ApiOkResponse({ description: 'Authenticated account', type: PublicUserResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Authenticated account was not found', type: ApiErrorResponseDto })
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a legacy JWT body token' })
  @ApiOkResponse({ description: 'Token resolved to a user', type: PublicUserResponseDto })
  @ApiBadRequestResponse({ description: 'Token is missing or malformed', type: ApiErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT is invalid or expired', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Token subject user was not found', type: ApiErrorResponseDto })
  token(@Body() dto: TokenDto) {
    if (!dto.token) {
      throw new BadRequestException({
        code: 'TOKEN_REQUIRED',
        message: 'Token is required',
      });
    }
    return this.authService.getUserFromToken(dto.token);
  }

  private publicAuthResponse(result: { user: unknown; token: string; message: string }) {
    return { user: result.user, token: result.token, message: result.message };
  }

  private setRefreshCookie(response: Response, refreshToken?: string): void {
    if (!refreshToken) return;
    response.cookie('food_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private readCookie(request: Request, name: string): string | undefined {
    const header = request.headers.cookie;
    if (!header) return undefined;
    return header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  }

  private clientIp(request: Request): string { return request.ip ?? request.socket.remoteAddress ?? 'unknown'; }
}
