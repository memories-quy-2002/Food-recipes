import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  it('maps a unique constraint violation to the stable conflict contract', () => {
    const json = jest.fn();
    const response = {
      status: jest.fn().mockReturnValue({ json }),
    };
    const request = {
      requestId: 'request-123',
      header: jest.fn().mockReturnValue('request-123'),
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    new PrismaExceptionFilter().catch(
      { code: 'P2002' } as never,
      host as never,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      code: 'RESOURCE_ALREADY_EXISTS',
      message: 'A resource with the same unique value already exists',
      requestId: 'request-123',
    });
  });
});
