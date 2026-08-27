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
});
