import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotesController } from './notes.controller';
import { NotesRepository, NOTES_REPOSITORY } from './notes.repository';
import { NotesService } from './notes.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [NotesController],
  providers: [NotesRepository, { provide: NOTES_REPOSITORY, useExisting: NotesRepository }, NotesService],
  exports: [NotesService],
})
export class NotesModule {}
