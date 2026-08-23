import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthSessionRepository, AUTH_SESSION_REPOSITORY } from './auth-session.repository';
import { AuthThrottleGuard } from '../../common/security/auth-throttle.guard';
import { AuthThrottleService } from '../../common/security/auth-throttle.service';
import { RolesGuard } from './guards/roles.guard';
import { RECOVERY_DELIVERY, RecoveryDeliveryService } from './recovery-delivery.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: (config.get<string>('auth.jwtExpiresIn') ??
            '15m') as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    AuthSessionRepository,
    { provide: AUTH_SESSION_REPOSITORY, useExisting: AuthSessionRepository },
    AuthThrottleService,
    AuthThrottleGuard,
    RolesGuard,
    RecoveryDeliveryService,
    { provide: RECOVERY_DELIVERY, useExisting: RecoveryDeliveryService },
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, AuthThrottleService, AuthThrottleGuard],
})
export class AuthModule {}
