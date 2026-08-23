import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PublicUser, UsersService } from '../users/users.service';
import { AUTH_SESSION_REPOSITORY, AuthSessionRepositoryPort } from './auth-session.repository';
import { PasswordRecoveryDto, ResetPasswordDto, VerifyEmailDto } from './dto/password-recovery.dto';
import { RECOVERY_DELIVERY, RecoveryDeliveryPort } from './recovery-delivery.service';

export type AuthResponse = {
  user: PublicUser;
  token: string;
  message: string;
  refreshToken?: string;
};

type AuthUsersPort = Pick<
  UsersService,
  'findByEmailWithPassword' | 'create' | 'toPublicUser' | 'findById'
> & Partial<Pick<UsersService, 'updatePassword' | 'markEmailVerified'>>;
type AuthJwtPort = Pick<JwtService, 'signAsync' | 'verifyAsync'>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: AuthUsersPort,
    @Inject(JwtService) private readonly jwtService: AuthJwtPort,
    @Optional() private readonly configService?: ConfigService,
    @Optional() @Inject(AUTH_SESSION_REPOSITORY) private readonly sessions?: AuthSessionRepositoryPort,
    @Optional() @Inject(RECOVERY_DELIVERY) private readonly recoveryDelivery?: RecoveryDeliveryPort,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const user = await this.usersService.create({
      fullName: `${dto.name.first} ${dto.name.last}`.trim(),
      email: dto.email,
      password: dto.password,
    });
    const response = await this.withToken(user, 'Signed up!');
    await this.issueVerification(user);
    return response;
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    return this.withToken(this.usersService.toPublicUser(user), 'Logged in!');
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    if (!this.sessions) throw this.invalidRefreshToken();
    const rotated = await this.sessions.rotateSession(refreshToken, this.refreshDays());
    if (!rotated) throw this.invalidRefreshToken();
    const user = await this.usersService.findById(rotated.userId);
    return this.withToken(user, 'Token refreshed!', rotated.refreshToken);
  }

  async logout(refreshToken?: string, userId?: number): Promise<void> {
    if (!this.sessions) return;
    if (refreshToken) await this.sessions.revokeSession(refreshToken);
    if (userId) await this.sessions.revokeAllSessions(userId);
  }

  async forgotPassword(dto: PasswordRecoveryDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (user && this.sessions) {
      const token = await this.sessions.createPasswordResetToken(user.id);
      await this.recoveryDelivery?.sendPasswordReset(user.email, token);
    }
    return { message: 'If the account exists, recovery instructions will be sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (!this.sessions) throw this.invalidRecoveryToken();
    const userId = await this.sessions.consumePasswordResetToken(dto.token);
    if (!userId) throw this.invalidRecoveryToken();
    if (!this.usersService.updatePassword) throw this.invalidRecoveryToken();
    await this.usersService.updatePassword(userId, await bcrypt.hash(dto.newPassword, 10));
    await this.sessions.revokeAllSessions(userId);
    return { message: 'Password reset successfully.' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    if (!this.sessions) throw this.invalidRecoveryToken();
    const userId = await this.sessions.consumeEmailVerificationToken(dto.token);
    if (!userId) throw this.invalidRecoveryToken();
    if (!this.usersService.markEmailVerified) throw this.invalidRecoveryToken();
    await this.usersService.markEmailVerified(userId);
    return { message: 'Email verified successfully.' };
  }

  async resendVerification(userId: number): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    await this.issueVerification(user);
    return { message: 'If the account is eligible, verification instructions will be sent.' };
  }

  async getUserFromToken(token: string): Promise<PublicUser> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: number;
        user_id?: number;
      }>(token, {
        secret: this.configService?.get<string>('auth.jwtSecret'),
      });
      const id = payload.sub ?? payload.user_id;
      if (!id) throw new Error('JWT subject is required');
      return this.usersService.findById(id);
    } catch {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'JWT is invalid or expired',
      });
    }
  }

  getMe(userId: number): Promise<PublicUser> {
    return this.usersService.findById(userId);
  }

  private async withToken(user: PublicUser, message: string, rotatedRefreshToken?: string): Promise<AuthResponse> {
    const token = await this.jwtService.signAsync({ sub: user.user_id, user_id: user.user_id, email: user.email });
    const refreshToken = rotatedRefreshToken ?? (this.sessions ? await this.sessions.createSession(user.user_id, this.refreshDays()) : undefined);
    return { user, token, message, ...(refreshToken ? { refreshToken } : {}) };
  }

  private refreshDays(): number {
    const days = this.configService?.get<number>('auth.refreshExpiresInDays') ?? 30;
    return Number.isInteger(days) && days > 0 && days <= 365 ? days : 30;
  }

  private invalidRefreshToken(): UnauthorizedException { return new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID', message: 'Refresh token is invalid or expired' }); }
  private invalidRecoveryToken(): UnauthorizedException { return new UnauthorizedException({ code: 'RECOVERY_TOKEN_INVALID', message: 'Recovery token is invalid or expired' }); }

  private async issueVerification(user: PublicUser): Promise<void> {
    if (!this.sessions || user.email_verified) return;
    const token = await this.sessions.createEmailVerificationToken(user.user_id);
    await this.recoveryDelivery?.sendEmailVerification(user.email, token);
  }
}
