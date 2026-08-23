import { Injectable } from '@nestjs/common';

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

  private async send(kind: string, email: string, token: string): Promise<void> {
    const webhook = process.env.AUTH_MAIL_WEBHOOK_URL?.trim();
    if (!webhook || process.env.NODE_ENV === 'test') return;

    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, email, token }),
    });
    if (!response.ok) throw new Error(`Recovery delivery failed with status ${response.status}`);
  }
}
