import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from './response.schemas';

export const ApiInternalServerErrorResponse = () =>
  applyDecorators(
    ApiResponse({
      status: 500,
      description: 'Unexpected server error',
      type: ApiErrorResponseDto,
    }),
  );
