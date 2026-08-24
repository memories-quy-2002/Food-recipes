import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PANTRY_REPOSITORY, PantryItemRecord, PantryRepositoryPort } from './pantry.repository';

@Injectable()
export class PantryService {
  constructor(@Inject(PANTRY_REPOSITORY) private readonly repository: PantryRepositoryPort) {}

  async list(userId: number): Promise<{ items: PantryItemRecord[] }> {
    return { items: await this.repository.list(userId) };
  }

  async create(userId: number, dto: CreatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = this.normalizeName(dto.name);
    return { item: await this.repository.create(userId, name, dto.have ?? true) };
  }

  async update(userId: number, pantryId: number, dto: UpdatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = dto.name === undefined ? undefined : this.normalizeName(dto.name);
    const item = await this.repository.update(userId, pantryId, name, dto.have);
    if (!item) throw this.notFound();
    return { item };
  }

  async remove(userId: number, pantryId: number): Promise<{ message: string }> {
    if (!(await this.repository.remove(userId, pantryId))) throw this.notFound();
    return { message: 'Pantry item removed' };
  }

  private normalizeName(name: string): string {
    const normalized = name.trim();
    if (!normalized) throw new BadRequestException({ code: 'PANTRY_NAME_EMPTY', message: 'Pantry item name cannot be empty' });
    return normalized;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'PANTRY_ITEM_NOT_FOUND', message: 'Pantry item not found' });
  }
}

export type PantryServicePort = Pick<PantryService, 'list' | 'create' | 'update' | 'remove'>;
