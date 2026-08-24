import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NOTES_REPOSITORY, NotesRepositoryPort, RecipeNoteRecord } from './notes.repository';

@Injectable()
export class NotesService {
  constructor(@Inject(NOTES_REPOSITORY) private readonly repository: NotesRepositoryPort) {}

  async get(userId: number, recipeId: number): Promise<{ note: RecipeNoteRecord | null }> {
    if (!(await this.repository.recipeExists(recipeId))) throw this.notFound();
    return { note: await this.repository.findByUserAndRecipe(userId, recipeId) };
  }

  async upsert(userId: number, recipeId: number, dto: UpdateNoteDto): Promise<{ note: RecipeNoteRecord | null }> {
    if (!(await this.repository.recipeExists(recipeId))) throw this.notFound();
    const note = dto.note.trim();
    if (!note) {
      await this.repository.remove(userId, recipeId);
      return { note: null };
    }
    return { note: await this.repository.upsert(userId, recipeId, note) };
  }

  async remove(userId: number, recipeId: number): Promise<{ message: string }> {
    if (!(await this.repository.recipeExists(recipeId))) throw this.notFound();
    await this.repository.remove(userId, recipeId);
    return { message: 'Recipe note removed' };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
  }
}

export type NotesServicePort = Pick<NotesService, 'get' | 'upsert' | 'remove'>;
