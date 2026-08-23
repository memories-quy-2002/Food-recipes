import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { AddWishlistDto } from './dto/add-wishlist.dto';
import { WishlistService, WishlistServicePort } from './wishlist.service';
import {
  ApiErrorResponseDto,
  MessageResponseDto,
  WishlistResponseDto,
  WishlistItemResponseDto,
} from '../../common/swagger/response.schemas';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/wishlist', version: '1' })
export class WishlistController {
  constructor(
    @Inject(WishlistService)
    private readonly wishlistService: WishlistServicePort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List saved recipes for the authenticated user' })
  @ApiOkResponse({ description: 'Saved recipes', type: WishlistResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  list(@CurrentUser() user: AuthUser) {
    return this.wishlistService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a recipe for the authenticated user' })
  @ApiCreatedResponse({ description: 'Recipe saved', type: WishlistItemResponseDto })
  @ApiBadRequestResponse({ description: 'Wishlist input is invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe was not found', type: ApiErrorResponseDto })
  add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistDto) {
    return this.wishlistService.add(user.id, dto.recipeId);
  }

  @Delete(':recipeId')
  @ApiOperation({ summary: 'Remove a saved recipe for the authenticated user' })
  @ApiParam({ name: 'recipeId', type: Number, description: 'Recipe identifier' })
  @ApiBadRequestResponse({ description: 'Recipe identifier is invalid', type: ApiErrorResponseDto })
  @ApiOkResponse({ description: 'Recipe removed from the wishlist', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'JWT is missing or invalid', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Wishlist item was not found', type: ApiErrorResponseDto })
  remove(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.wishlistService.remove(user.id, recipeId);
  }
}
