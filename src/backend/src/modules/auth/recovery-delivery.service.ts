import { Injectable } from '@nestjs/common';

export type RecoveryDeliveryKind = 'password-reset' | 'email-verification';

export type RecoveryDeliveryPayload = {
  kind: RecoveryDeliveryKind;
  email: string;
  token: string;
  link: string | null;
};

export interface RecoveryDeliveryPort {
  sendPasswordReset(email: string, token: string): Promise<void>;
  sendEmailVerification(email: string, token: string): Promise<void>;
}

export const RECOVERY_DELIVERY = Symbol('RECOVERY_DELIVERY');

@Injectable()
export class RecoveryDeliveryService implements RecoveryDeliveryPort {
  async sendPasswordReset(email: string, token: string): Promise<void> {
    await this.send('password-reset', email, token);
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    await this.send('email-verification', email, token);
  }

  private async send(kind: RecoveryDeliveryKind, email: string, token: string): Promise<void> {
    const webhook = process.env.AUTH_MAIL_WEBHOOK_URL?.trim();
    if (!webhook || process.env.NODE_ENV === 'test') return;

    const link = this.buildLink(kind, token);
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, email, token, link } satisfies RecoveryDeliveryPayload),
    });
    if (!response.ok) throw new Error(`Recovery delivery failed with status ${response.status}`);
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
