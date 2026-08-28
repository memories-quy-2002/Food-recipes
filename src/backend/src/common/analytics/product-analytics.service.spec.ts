import { ProductAnalyticsService } from './product-analytics.service';

describe('ProductAnalyticsService', () => {
  it('emits an allowlisted event without sensitive or free-text fields', () => {
    const service = new ProductAnalyticsService();
    const logger = (service as unknown as { logger: { debug: jest.Mock } }).logger;
    logger.debug = jest.fn();
    service.track('recipe_import_completed', {
      source: 'jsonld', recipe_id: 7, email: 'ada@example.com', journal: 'keep private', ingredients: 'raw text',
    } as never);
    expect(logger.debug).toHaveBeenCalledWith(expect.not.stringContaining('ada@example.com'));
    expect(logger.debug).toHaveBeenCalledWith(expect.not.stringContaining('keep private'));
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('recipe_import_completed'));
  });

  it('rejects unknown events', () => {
    expect(() => new ProductAnalyticsService().track('private_event' as never)).toThrow('Unsupported product analytics event');
  });
});
