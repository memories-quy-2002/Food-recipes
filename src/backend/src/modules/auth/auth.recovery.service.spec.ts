import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-reset-password'),
}));

describe('AuthService recovery flows', () => {
  const usersService = {
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    toPublicUser: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const sessions = {
    createSession: jest.fn(),
    rotateSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
    createPasswordResetToken: jest.fn(),
    consumePasswordResetToken: jest.fn(),
    createEmailVerificationToken: jest.fn(),
    consumeEmailVerificationToken: jest.fn(),
  };
  const recoveryDelivery = {
    sendPasswordReset: jest.fn(),
    sendEmailVerification: jest.fn(),
  };

  const createService = (): AuthService =>
    new AuthService(
      usersService as never,
      jwtService as never,
      undefined,
      sessions,
      recoveryDelivery,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    usersService.findByEmailWithPassword.mockResolvedValue(null);
    usersService.findById.mockResolvedValue({
      user_id: 7,
      email: 'cook@example.test',
      email_verified: false,
    });
    sessions.createPasswordResetToken.mockResolvedValue('reset-token');
    sessions.consumePasswordResetToken.mockResolvedValue(7);
    sessions.createEmailVerificationToken.mockResolvedValue('verification-token');
    sessions.consumeEmailVerificationToken.mockResolvedValue(7);
  });

  it('returns the same generic response for an unknown recovery email', async () => {
    const result = await createService().forgotPassword({
      email: 'unknown@example.test',
    });

    expect(result).toEqual({
      message: 'If the account exists, recovery instructions will be sent.',
    });
    expect(sessions.createPasswordResetToken).not.toHaveBeenCalled();
    expect(recoveryDelivery.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('creates a reset token and sends it only through the delivery boundary', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 7,
      email: 'cook@example.test',
    });

    await expect(
      createService().forgotPassword({ email: 'cook@example.test' }),
    ).resolves.toEqual({
      message: 'If the account exists, recovery instructions will be sent.',
    });

    expect(sessions.createPasswordResetToken).toHaveBeenCalledWith(7);
    expect(recoveryDelivery.sendPasswordReset).toHaveBeenCalledWith(
      'cook@example.test',
      'reset-token',
    );
  });

  it('hashes the new password and revokes all sessions after reset', async () => {
    await expect(
      createService().resetPassword({
        token: 'reset-token',
        newPassword: 'correct horse battery staple',
      }),
    ).resolves.toEqual({ message: 'Password reset successfully.' });

    expect(sessions.consumePasswordResetToken).toHaveBeenCalledWith('reset-token');
    expect(bcrypt.hash).toHaveBeenCalledWith(
      'correct horse battery staple',
      10,
    );
    expect(usersService.updatePassword).toHaveBeenCalledWith(
      7,
      'hashed-reset-password',
    );
    expect(sessions.revokeAllSessions).toHaveBeenCalledWith(7);
  });

  it('rejects an expired or consumed reset token before changing the password', async () => {
    sessions.consumePasswordResetToken.mockResolvedValue(null);

    await expect(
      createService().resetPassword({
        token: 'expired-token',
        newPassword: 'correct horse battery staple',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.updatePassword).not.toHaveBeenCalled();
    expect(sessions.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('marks the account verified after consuming an email token', async () => {
    await expect(
      createService().verifyEmail({ token: 'verification-token' }),
    ).resolves.toEqual({ message: 'Email verified successfully.' });

    expect(sessions.consumeEmailVerificationToken).toHaveBeenCalledWith(
      'verification-token',
    );
    expect(usersService.markEmailVerified).toHaveBeenCalledWith(7);
  });

  it('resends verification only when the account is not already verified', async () => {
    await expect(createService().resendVerification(7)).resolves.toEqual({
      message: 'If the account is eligible, verification instructions will be sent.',
    });
    expect(sessions.createEmailVerificationToken).toHaveBeenCalledWith(7);
    expect(recoveryDelivery.sendEmailVerification).toHaveBeenCalledWith(
      'cook@example.test',
      'verification-token',
    );

    usersService.findById.mockResolvedValue({
      user_id: 7,
      email: 'cook@example.test',
      email_verified: true,
    });
    await createService().resendVerification(7);
    expect(sessions.createEmailVerificationToken).toHaveBeenCalledTimes(1);
    expect(recoveryDelivery.sendEmailVerification).toHaveBeenCalledTimes(1);
  });
});
