import { ConflictException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  it('preserves structured shortage details for cooking confirmation', () => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) };
    const request = { requestId: 'request-123', header: jest.fn().mockReturnValue(null) };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };
    const shortages = [{ ingredient_name: 'rice', missing_quantity: 200 }];

    new GlobalExceptionFilter().catch(
      new ConflictException({
        code: 'COOKING_PANTRY_SHORTAGE',
        message: 'Some ingredients are missing from your pantry',
        shortages,
      }),
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'COOKING_PANTRY_SHORTAGE',
      shortages,
    }));
  });

  it('maps an oversized body-parser error to a generic 413 response', () => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) };
    const request = { requestId: 'request-413', header: jest.fn().mockReturnValue(null) };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    new GlobalExceptionFilter().catch(
      Object.assign(new Error('request entity too large'), {
        status: 413,
        statusCode: 413,
        type: 'entity.too.large',
      }),
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload is too large',
    }));
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('entity.too.large');
  });
});
