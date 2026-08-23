import { HttpException } from '@nestjs/common';
import { AuthThrottleService } from './auth-throttle.service';

describe('AuthThrottleService', () => {
  it('limits repeated attempts by IP and normalized email', () => {
    const service = new AuthThrottleService();
    for (let attempt = 0; attempt < 5; attempt += 1) service.recordFailure('127.0.0.1', 'ADA@example.com');

    expect(() => service.assertAllowed('127.0.0.1', 'ada@example.com')).toThrow(HttpException);
  });

  it('clears the counters after successful authentication', () => {
    const service = new AuthThrottleService();
    service.recordFailure('127.0.0.1', 'ada@example.com');
    service.recordSuccess('127.0.0.1', 'ADA@example.com');

    expect(() => service.assertAllowed('127.0.0.1', 'ada@example.com')).not.toThrow();
  });
});
