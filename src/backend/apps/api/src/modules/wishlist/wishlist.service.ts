import { Injectable, NotFoundException } from '@nestjs/common';
import {
  WishlistItem,
  WishlistRepositoryPort,
} from './wishlist.repository';

@Injectable()
export class WishlistService {
  constructor(private readonly repository: WishlistRepositoryPort) {}

  async list(userId: number): Promise<{ wishlist: WishlistItem[] }> {
    return { wishlist: await this.repository.listByUserId(userId) };
  }

  async add(userId: number, recipeId: number): Promise<WishlistItem> {
    const item = await this.repository.add(userId, recipeId);
    if (!item) {
      throw new NotFoundException({
        code: 'RECIPE_NOT_FOUND',
        message: 'Recipe not found',
      });
    }
    return item;
  }

  async remove(userId: number, recipeId: number): Promise<{ message: string }> {
    const removed = await this.repository.remove(userId, recipeId);
    if (!removed) {
      throw new NotFoundException({
        code: 'WISHLIST_ITEM_NOT_FOUND',
        message: 'Wishlist item not found',
      });
    }
    return { message: 'Wishlist item removed' };
  }
}

export type WishlistServicePort = Pick<
  WishlistService,
  'list' | 'add' | 'remove'
>;
