import { Injectable } from '@nestjs/common';

export type RecoveryDeliveryKind = 'password-reset' | 'email-verification';

export interface RecoveryDeliveryPort {
  sendPasswordReset(email: string, token: string): Promise<void>;
  sendEmailVerification(email: string, token: string): Promise<void>;
}

export const RECOVERY_DELIVERY = Symbol('RECOVERY_DELIVERY');

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

@Injectable()
export class RecoveryDeliveryService implements RecoveryDeliveryPort {
  async sendPasswordReset(email: string, token: string): Promise<void> {
    await this.send('password-reset', email, token);
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    await this.send('email-verification', email, token);
  }

  private async send(kind: RecoveryDeliveryKind, email: string, token: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    const apiKey = process.env.BREVO_API_KEY?.trim();
    const senderEmail = process.env.AUTH_MAIL_FROM_EMAIL?.trim();
    if (!apiKey || !senderEmail) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Recovery delivery is not configured');
      }
      return;
    }

    const link = this.buildLink(kind, token);
    if (!link) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Recovery public web URL is not configured');
      }
      return;
    }

    const isPasswordReset = kind === 'password-reset';
    const subject = isPasswordReset
      ? 'Reset your Food Recipes password'
      : 'Verify your Food Recipes email';
    const textContent = isPasswordReset
      ? `You requested a password reset for Food Recipes.\n\nReset your password: ${link}\n\nIf you did not request this, you can ignore this email.`
      : `Verify your email address for Food Recipes: ${link}\n\nIf you did not create this account, you can ignore this email.`;
    const htmlContent = isPasswordReset
      ? `<p>You requested a password reset for Food Recipes.</p><p><a href="${escapeHtml(link)}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`
      : `<p>Verify your email address for Food Recipes.</p><p><a href="${escapeHtml(link)}">Verify email</a></p><p>If you did not create this account, you can ignore this email.</p>`;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: process.env.AUTH_MAIL_FROM_NAME?.trim() || 'Food Recipes',
        },
        to: [{ email }],
        subject,
        textContent,
        htmlContent,
        tags: [isPasswordReset ? 'password-reset' : 'email-verification'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Recovery delivery failed with status ${response.status}`);
    }
  }

  private buildLink(kind: RecoveryDeliveryKind, token: string): string | null {
    const publicWebUrl = process.env.AUTH_PUBLIC_WEB_URL?.trim();
    if (!publicWebUrl) return null;

    const path = kind === 'password-reset' ? '/account/reset-password' : '/account/verify-email';
    const link = new URL(path, publicWebUrl);
    link.searchParams.set('token', token);
    return link.toString();
  }
}
