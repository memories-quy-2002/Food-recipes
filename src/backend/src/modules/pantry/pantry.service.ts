import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { normalizePantryUnit } from './pantry-inventory';
import { PANTRY_REPOSITORY, PantryItemRecord, PantryRepositoryPort } from './pantry.repository';
import { PANTRY_STORAGE_LOCATIONS, PantryStorageLocation } from './pantry-storage';
export type PantryExpiryStatus = 'none' | 'fresh' | 'use_soon' | 'expired';

const utcDay = (value: Date | string): number => {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return Date.UTC(value instanceof Date ? value.getUTCFullYear() : new Date(value).getUTCFullYear(), value instanceof Date ? value.getUTCMonth() : new Date(value).getUTCMonth(), value instanceof Date ? value.getUTCDate() : new Date(value).getUTCDate());
};

export const getPantryExpiryStatus = (expiresAt: Date | string | null | undefined, today = new Date()): PantryExpiryStatus => {
  if (!expiresAt) return 'none';
  const difference = (utcDay(expiresAt) - utcDay(today)) / (24 * 60 * 60 * 1000);
  if (!Number.isFinite(difference)) return 'none';
  if (difference < 0) return 'expired';
  return difference <= 3 ? 'use_soon' : 'fresh';
};

@Injectable()
export class PantryService {
  constructor(@Inject(PANTRY_REPOSITORY) private readonly repository: PantryRepositoryPort) {}

  async list(userId: number): Promise<{ items: PantryItemRecord[] }> {
    return { items: (await this.repository.list(userId)).map((item) => this.withExpiryStatus(item)) };
  }

  async listForHousehold(householdId: number): Promise<{ items: PantryItemRecord[] }> {
    return { items: (await this.repository.listForHousehold(householdId)).map((item) => this.withExpiryStatus(item)) };
  }

  async create(userId: number, dto: CreatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = this.normalizeName(dto.name);
    const quantity = this.normalizeQuantity(dto.quantity);
    const unit = this.normalizeUnit(dto.unit);
    const purchasedAt = this.normalizeDate(dto.purchasedAt);
    const openedAt = this.normalizeDate(dto.openedAt);
    const expiresAt = this.normalizeDate(dto.expiresAt);
    const storageLocation = this.normalizeStorageLocation(dto.storageLocation);
    this.validateQuantityUnit(quantity, unit);
    const item = await this.repository.create(userId, name, quantity, unit, dto.have ?? true, purchasedAt, openedAt, expiresAt, storageLocation);
    return { item: this.withExpiryStatus(item) };
  }

  async createForHousehold(householdId: number, dto: CreatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = this.normalizeName(dto.name);
    const quantity = this.normalizeQuantity(dto.quantity);
    const unit = this.normalizeUnit(dto.unit);
    const purchasedAt = this.normalizeDate(dto.purchasedAt);
    const openedAt = this.normalizeDate(dto.openedAt);
    const expiresAt = this.normalizeDate(dto.expiresAt);
    const storageLocation = this.normalizeStorageLocation(dto.storageLocation);
    this.validateQuantityUnit(quantity, unit);
    const item = await this.repository.createForHousehold(householdId, name, quantity, unit, dto.have ?? true, purchasedAt, openedAt, expiresAt, storageLocation);
    return { item: this.withExpiryStatus(item) };
  }

  async update(userId: number, pantryId: number, dto: UpdatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = dto.name === undefined ? undefined : this.normalizeName(dto.name);
    const quantity = dto.quantity === undefined ? undefined : this.normalizeQuantity(dto.quantity);
    const unit = dto.unit === undefined ? undefined : this.normalizeUnit(dto.unit);
    const purchasedAt = this.normalizeDate(dto.purchasedAt);
    const openedAt = this.normalizeDate(dto.openedAt);
    const expiresAt = this.normalizeDate(dto.expiresAt);
    const storageLocation = this.normalizeStorageLocation(dto.storageLocation);
    if (dto.quantity !== undefined || dto.unit !== undefined) this.validateQuantityUnit(quantity ?? null, unit ?? null);
    const item = await this.repository.update(userId, pantryId, name, quantity, unit, dto.have, purchasedAt, openedAt, expiresAt, storageLocation);
    if (!item) throw this.notFound();
    return { item: this.withExpiryStatus(item) };
  }

  async updateForHousehold(householdId: number, pantryId: number, dto: UpdatePantryItemDto): Promise<{ item: PantryItemRecord }> {
    const name = dto.name === undefined ? undefined : this.normalizeName(dto.name);
    const quantity = dto.quantity === undefined ? undefined : this.normalizeQuantity(dto.quantity);
    const unit = dto.unit === undefined ? undefined : this.normalizeUnit(dto.unit);
    const purchasedAt = this.normalizeDate(dto.purchasedAt);
    const openedAt = this.normalizeDate(dto.openedAt);
    const expiresAt = this.normalizeDate(dto.expiresAt);
    const storageLocation = this.normalizeStorageLocation(dto.storageLocation);
    if (dto.quantity !== undefined || dto.unit !== undefined) this.validateQuantityUnit(quantity ?? null, unit ?? null);
    const item = await this.repository.updateForHousehold(householdId, pantryId, name, quantity, unit, dto.have, purchasedAt, openedAt, expiresAt, storageLocation);
    if (!item) throw this.notFound();
    return { item: this.withExpiryStatus(item) };
  }

  async remove(userId: number, pantryId: number): Promise<{ message: string }> {
    if (!(await this.repository.remove(userId, pantryId))) throw this.notFound();
    return { message: 'Pantry item removed' };
  }

  async removeForHousehold(householdId: number, pantryId: number): Promise<{ message: string }> {
    if (!(await this.repository.removeForHousehold(householdId, pantryId))) throw this.notFound();
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

  private normalizeDate(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const datePart = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      throw new BadRequestException({ code: 'PANTRY_DATE_INVALID', message: 'Pantry dates must be valid ISO dates' });
    }
    const parsed = new Date(`${datePart}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== datePart) {
      throw new BadRequestException({ code: 'PANTRY_DATE_INVALID', message: 'Pantry dates must be valid ISO dates' });
    }
    return datePart;
  }

  private normalizeStorageLocation(value: string | null | undefined): PantryStorageLocation | null | undefined {
    if (value === undefined || value === null) return value;
    const normalized = value.trim().toLowerCase();
    if (!(PANTRY_STORAGE_LOCATIONS as readonly string[]).includes(normalized)) {
      throw new BadRequestException({ code: 'PANTRY_STORAGE_LOCATION_INVALID', message: 'Pantry storage location is not supported' });
    }
    return normalized as PantryStorageLocation;
  }

  private withExpiryStatus(item: PantryItemRecord): PantryItemRecord {
    return { ...item, expiry_status: getPantryExpiryStatus(item.expires_at) };
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

export type PantryServicePort = Pick<PantryService, 'list' | 'create' | 'update' | 'remove' | 'listForHousehold' | 'createForHousehold' | 'updateForHousehold' | 'removeForHousehold'>;
