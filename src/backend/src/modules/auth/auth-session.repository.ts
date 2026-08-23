import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type ActiveSession = { session_id: number; user_id: number; family_id: string; expires_at: Date };

export type RotatedSession = { userId: number; refreshToken: string };

export interface AuthSessionRepositoryPort {
  createSession(userId: number, expiresInDays: number): Promise<string>;
  rotateSession(refreshToken: string, expiresInDays: number): Promise<RotatedSession | null>;
  revokeSession(refreshToken: string): Promise<void>;
  revokeAllSessions(userId: number): Promise<void>;
  createPasswordResetToken(userId: number): Promise<string>;
  consumePasswordResetToken(token: string): Promise<number | null>;
  createEmailVerificationToken(userId: number): Promise<string>;
  consumeEmailVerificationToken(token: string): Promise<number | null>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

@Injectable()
export class AuthSessionRepository implements AuthSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: number, expiresInDays: number): Promise<string> {
    const refreshToken = this.newToken();
    const hash = this.hash(refreshToken);
    const familyId = randomUUID();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO auth_sessions (user_id, family_id, token_hash, expires_at)
      VALUES (${userId}, ${familyId}, ${hash}, CURRENT_TIMESTAMP + (${expiresInDays} * INTERVAL '1 day'))
    `);
    return refreshToken;
  }

  async rotateSession(refreshToken: string, expiresInDays: number): Promise<RotatedSession | null> {
    const presentedHash = this.hash(refreshToken);
    const nextToken = this.newToken();
    const nextHash = this.hash(nextToken);
    return this.prisma.$transaction(async (tx) => {
      const active = await tx.$queryRaw<ActiveSession[]>(Prisma.sql`
        SELECT session_id, user_id, family_id, expires_at FROM auth_sessions
        WHERE token_hash = ${presentedHash} AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
        FOR UPDATE
      `);
      if (active[0]) {
        const current = active[0];
        const inserted = await tx.$queryRaw<{ session_id: number }[]>(Prisma.sql`
          INSERT INTO auth_sessions (user_id, family_id, token_hash, expires_at)
          VALUES (${current.user_id}, ${current.family_id}, ${nextHash}, CURRENT_TIMESTAMP + (${expiresInDays} * INTERVAL '1 day'))
          RETURNING session_id
        `);
        await tx.$executeRaw(Prisma.sql`
          UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP, replaced_by = ${inserted[0].session_id}
          WHERE session_id = ${current.session_id}
        `);
        return { userId: current.user_id, refreshToken: nextToken };
      }

      const reused = await tx.$queryRaw<{ family_id: string }[]>(Prisma.sql`
        SELECT family_id FROM auth_sessions WHERE token_hash = ${presentedHash}
      `);
      if (reused[0]) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP
          WHERE family_id = ${reused[0].family_id} AND revoked_at IS NULL
        `);
      }
      return null;
    });
  }

  async revokeSession(refreshToken: string): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ${this.hash(refreshToken)} AND revoked_at IS NULL`);
  }

  async revokeAllSessions(userId: number): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ${userId} AND revoked_at IS NULL`);
  }

  async createPasswordResetToken(userId: number): Promise<string> {
    const token = this.newToken();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${this.hash(token)}, CURRENT_TIMESTAMP + INTERVAL '1 hour')
    `);
    return token;
  }

  async consumePasswordResetToken(token: string): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ user_id: number }[]>(Prisma.sql`
      UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP
      WHERE token_hash = ${this.hash(token)} AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      RETURNING user_id
    `);
    return rows[0]?.user_id ?? null;
  }

  async createEmailVerificationToken(userId: number): Promise<string> {
    const token = this.newToken();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${this.hash(token)}, CURRENT_TIMESTAMP + INTERVAL '24 hours')
    `);
    return token;
  }

  async consumeEmailVerificationToken(token: string): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ user_id: number }[]>(Prisma.sql`
      UPDATE email_verification_tokens SET consumed_at = CURRENT_TIMESTAMP
      WHERE token_hash = ${this.hash(token)} AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      RETURNING user_id
    `);
    return rows[0]?.user_id ?? null;
  }

  private newToken(): string { return randomBytes(32).toString('base64url'); }
  private hash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
}
