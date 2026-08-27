import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { normalizePantryUnit } from './pantry-inventory';
import { PANTRY_REPOSITORY, PantryItemRecord, PantryRepositoryPort } from './pantry.repository';

@Injectable()
export class PantryService {
  constructor(@Inject(PANTRY_REPOSITORY) private readonly repository: PantryRepositoryPort) {}

  async list(userId: number): Promise<{ items: PantryItemRecord[] }> {
    return { items: await this.repository.list(userId) };
  }

  async create(userId: number, dto: CreatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = this.normalizeName(dto.name);
    const quantity = this.normalizeQuantity(dto.quantity);
    const unit = this.normalizeUnit(dto.unit);
    this.validateQuantityUnit(quantity, unit);
    return { item: await this.repository.create(userId, name, quantity, unit, dto.have ?? true) };
  }

  async update(userId: number, pantryId: number, dto: UpdatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = dto.name === undefined ? undefined : this.normalizeName(dto.name);
    const quantity = dto.quantity === undefined ? undefined : this.normalizeQuantity(dto.quantity);
    const unit = dto.unit === undefined ? undefined : this.normalizeUnit(dto.unit);
    if (dto.quantity !== undefined || dto.unit !== undefined) this.validateQuantityUnit(quantity ?? null, unit ?? null);
    const item = await this.repository.update(userId, pantryId, name, quantity, unit, dto.have);
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

  private normalizeQuantity(quantity: number | null | undefined): number | null {
    if (quantity === undefined || quantity === null) return null;
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 1_000_000 || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > Number.EPSILON * 1000) {
      throw new BadRequestException({ code: 'PANTRY_QUANTITY_INVALID', message: 'Pantry quantity must be between 0 and 1000000' });
    }
    return Number(quantity.toFixed(3));
  }

  private normalizeUnit(unit: string | null | undefined): string | null {
    if (unit === undefined || unit === null || !unit.trim()) return null;
    const normalized = normalizePantryUnit(unit);
    if (!normalized) throw new BadRequestException({ code: 'PANTRY_UNIT_INVALID', message: 'Pantry unit is not supported' });
    return normalized;
  }

  private validateQuantityUnit(quantity: number | null, unit: string | null): void {
    if ((quantity === null) !== (unit === null)) {
      throw new BadRequestException({ code: 'PANTRY_QUANTITY_UNIT_REQUIRED', message: 'Pantry quantity and unit must be provided together' });
    }
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'PANTRY_ITEM_NOT_FOUND', message: 'Pantry item not found' });
  }
}

export type PantryServicePort = Pick<PantryService, 'list' | 'create' | 'update' | 'remove'>;
