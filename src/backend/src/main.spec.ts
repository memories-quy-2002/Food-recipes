jest.mock('./app.module', () => ({
  AppModule: class MockAppModule {},
}));

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { configureExceptionFilters } from './main';

describe('global exception filter registration', () => {
  it('declares the catch-all filter before the Prisma-specific filter', () => {
    const useGlobalFilters = jest.fn();

    configureExceptionFilters({ useGlobalFilters });

    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    const [catchAll, prisma] = useGlobalFilters.mock.calls[0];
    expect(catchAll).toBeInstanceOf(GlobalExceptionFilter);
    expect(prisma).toBeInstanceOf(PrismaExceptionFilter);
  });
});
