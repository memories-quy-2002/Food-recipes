import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WishlistController } from './wishlist.controller';
import {
  WishlistRepository,
  WISHLIST_REPOSITORY,
} from './wishlist.repository';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [WishlistController],
  providers: [
    WishlistRepository,
    { provide: WISHLIST_REPOSITORY, useExisting: WishlistRepository },
    WishlistService,
  ],
  exports: [WishlistRepository, WishlistService],
})
export class WishlistModule {}
