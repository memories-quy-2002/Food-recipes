import { writeStructuredLog } from './structured-logger';

describe('writeStructuredLog', () => {
  afterEach(() => jest.restoreAllMocks());

  it('writes a single JSON object that Railway can parse', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    writeStructuredLog('info', 'Recipe request completed', {
      type: 'http_request',
      requestId: 'request-123',
      statusCode: 200,
    });

    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(log.mock.calls[0][0])).toEqual(expect.objectContaining({
      level: 'info',
      message: 'Recipe request completed',
      type: 'http_request',
      requestId: 'request-123',
      statusCode: 200,
    }));
  });
});
