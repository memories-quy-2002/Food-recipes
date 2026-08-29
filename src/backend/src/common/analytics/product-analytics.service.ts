import { Injectable, Logger } from '@nestjs/common';
import { PRODUCT_ANALYTICS_EVENTS, type ProductAnalyticsEvent, type ProductAnalyticsPayload, type ProductAnalyticsPort, type ProductAnalyticsValue } from './product-analytics.port';

const SAFE_KEYS = new Set(['surface', 'candidate_count', 'result_count', 'position', 'recipe_id', 'plan_id', 'session_id', 'household_id', 'status', 'source', 'scope', 'duration_ms']);
const FORBIDDEN = /(email|token|jwt|password|journal|note|invite|ingredient|phone|address)/i;

@Injectable()
export class ProductAnalyticsService implements ProductAnalyticsPort {
  private readonly logger = new Logger(ProductAnalyticsService.name);

  track(event: ProductAnalyticsEvent, payload: ProductAnalyticsPayload = {}): void {
    if (!PRODUCT_ANALYTICS_EVENTS.includes(event)) throw new Error('Unsupported product analytics event');
    const safePayload: ProductAnalyticsPayload = {};
    for (const [key, value] of Object.entries(payload)) {
      if (FORBIDDEN.test(key) || !SAFE_KEYS.has(key)) continue;
      if (!['string', 'number', 'boolean'].includes(typeof value)) continue;
      if (typeof value === 'string' && value.length > 80) continue;
      safePayload[key] = value as ProductAnalyticsValue;
    }
    this.logger.debug(JSON.stringify({ event, ...safePayload }));
  }
}
