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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { AddWishlistDto } from './dto/add-wishlist.dto';
import { WishlistService, WishlistServicePort } from './wishlist.service';

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
  list(@CurrentUser() user: AuthUser) {
    return this.wishlistService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a recipe for the authenticated user' })
  add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistDto) {
    return this.wishlistService.add(user.id, dto.recipeId);
  }

  @Delete(':recipeId')
  @ApiOperation({ summary: 'Remove a saved recipe for the authenticated user' })
  remove(
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.wishlistService.remove(user.id, recipeId);
  }
}
