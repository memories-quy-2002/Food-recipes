import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LeftoversController } from './leftovers.controller';
import { LEFTOVERS_REPOSITORY, LeftoversRepository } from './leftovers.repository';
import { LeftoversService } from './leftovers.service';
@Module({ imports: [PrismaModule, AuthModule], controllers: [LeftoversController], providers: [LeftoversRepository, { provide: LEFTOVERS_REPOSITORY, useExisting: LeftoversRepository }, LeftoversService], exports: [LeftoversService] })
export class LeftoversModule {}
