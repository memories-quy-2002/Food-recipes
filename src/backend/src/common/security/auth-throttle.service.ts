import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type Counter = { failures: number; expiresAt: number };

@Injectable()
export class AuthThrottleService {
  private readonly counters = new Map<string, Counter>();
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maxFailures = 5;
  private readonly maxEntries = 10_000;

  assertAllowed(ip: string, email?: string): void {
    this.cleanup();
    const keys = this.keys(ip, email);
    if (keys.some((key) => (this.counters.get(key)?.failures ?? 0) >= this.maxFailures)) {
      throw new HttpException({ code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts. Try again later.' }, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  recordFailure(ip: string, email?: string): void {
    for (const key of this.keys(ip, email)) {
      const current = this.counters.get(key);
      const next = current && current.expiresAt > Date.now() ? current : { failures: 0, expiresAt: Date.now() + this.windowMs };
      this.counters.set(key, { failures: next.failures + 1, expiresAt: next.expiresAt });
    }
    this.trim();
  }

  recordSuccess(ip: string, email?: string): void {
    for (const key of this.keys(ip, email)) this.counters.delete(key);
  }

  private keys(ip: string, email?: string): string[] {
    const normalizedIp = (typeof ip === 'string' ? ip : 'unknown').trim().toLowerCase().slice(0, 128);
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase().slice(0, 255) : undefined;
    return normalizedEmail ? [`ip:${normalizedIp}`, `identity:${normalizedIp}:${normalizedEmail}`] : [`ip:${normalizedIp}`];
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.counters) if (value.expiresAt <= now) this.counters.delete(key);
  }

  private trim(): void {
    while (this.counters.size > this.maxEntries) this.counters.delete(this.counters.keys().next().value as string);
  }
}
