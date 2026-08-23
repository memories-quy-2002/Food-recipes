import { ValidationPipe } from '@nestjs/common';

export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
