import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { convertQuantity, normalizeIngredientName, normalizePantryUnit, parseShoppingListQuantity, type PantryUnit } from './pantry-inventory';

export type PantryItemRecord = {
  pantry_id: number;
  user_id: number | null;
  household_id?: number | null;
  name: string;
  have: boolean;
  quantity: number | null;
  unit: string | null;
  purchased_at: Date | string | null;
  opened_at: Date | string | null;
  expires_at: Date | string | null;
  storage_location: string | null;
  expiry_status?: 'none' | 'fresh' | 'use_soon' | 'expired';
  updated_at: Date;
};

export type ShoppingListPantryImportSkipped = {
  item_id: number;
  label: string;
  quantity: string | null;
  reason: 'quantity_or_unit_required' | 'pantry_unit_conflict';
};

export type ShoppingListPantryImportResult = {
  imported_items: number;
  skipped_items: ShoppingListPantryImportSkipped[];
};

export interface PantryRepositoryPort {
  list(userId: number): Promise<PantryItemRecord[]>;
  create(userId: number, name: string, quantity: number | null, unit: string | null, have: boolean, purchasedAt?: string | null, openedAt?: string | null, expiresAt?: string | null, storageLocation?: string | null): Promise<PantryItemRecord>;
  update(userId: number, pantryId: number, name?: string, quantity?: number | null, unit?: string | null, have?: boolean, purchasedAt?: string | null, openedAt?: string | null, expiresAt?: string | null, storageLocation?: string | null): Promise<PantryItemRecord | null>;
  remove(userId: number, pantryId: number): Promise<boolean>;
  importCheckedShoppingItems(userId: number): Promise<ShoppingListPantryImportResult>;
  listForHousehold(householdId: number): Promise<PantryItemRecord[]>;
  createForHousehold(householdId: number, name: string, quantity: number | null, unit: string | null, have: boolean, purchasedAt?: string | null, openedAt?: string | null, expiresAt?: string | null, storageLocation?: string | null): Promise<PantryItemRecord>;
  updateForHousehold(householdId: number, pantryId: number, name?: string, quantity?: number | null, unit?: string | null, have?: boolean, purchasedAt?: string | null, openedAt?: string | null, expiresAt?: string | null, storageLocation?: string | null): Promise<PantryItemRecord | null>;
  removeForHousehold(householdId: number, pantryId: number): Promise<boolean>;
  importCheckedShoppingItemsForHousehold(householdId: number): Promise<ShoppingListPantryImportResult>;
}

export const PANTRY_REPOSITORY = Symbol('PANTRY_REPOSITORY');

@Injectable()
export class PantryRepository implements PantryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: number): Promise<PantryItemRecord[]> {
    return this.listByScope(this.scopeWhere(userId));
  }

  listForHousehold(householdId: number): Promise<PantryItemRecord[]> {
    return this.listByScope(this.scopeWhere(undefined, householdId));
  }

  async create(userId: number, name: string, quantity: number | null, unit: string | null, have: boolean, purchasedAt?: string | null, openedAt?: string | null, expiresAt?: string | null, storageLocation?: string | null): Promise<PantryItemRecord> {
    const rows = await this.prisma.$queryRaw<{ pantry_id: number }[]>(Prisma.sql`
      INSERT INTO pantry_items (user_id, household_id, name, quantity, unit, have, purchased_at, opened_at, expires_at, storage_location)
      VALUES (${userId}, NULL, ${name}, ${quantity}, ${unit}, ${have}, ${purchasedAt ?? null}, ${openedAt ?? null}, ${expiresAt ?? null}, ${storageLocation ?? null})
      RETURNING pantry_id
    `);
    return (await this.findByScope(this.scopeWhere(userId), rows[0].pantry_id))!;
  }

  async createForHousehold(householdId: number, name: string, quantity: number | null, unit: string | null, have: boolean, purchasedAt?: string | null, openedAt?: string | null, expiresAt?: string | null, storageLocation?: string | null): Promise<PantryItemRecord> {
    const rows = await this.prisma.$queryRaw<{ pantry_id: number }[]>(Prisma.sql`
      INSERT INTO pantry_items (user_id, household_id, name, quantity, unit, have, purchased_at, opened_at, expires_at, storage_location)
      VALUES (NULL, ${householdId}, ${name}, ${quantity}, ${unit}, ${have}, ${purchasedAt ?? null}, ${openedAt ?? null}, ${expiresAt ?? null}, ${storageLocation ?? null})
      RETURNING pantry_id
    `);
    return (await this.findByScope(this.scopeWhere(undefined, householdId), rows[0].pantry_id))!;
  }

  async update(
    userId: number,
    pantryId: number,
    name?: string,
    quantity?: number | null,
    unit?: string | null,
    have?: boolean,
    purchasedAt?: string | null,
    openedAt?: string | null,
    expiresAt?: string | null,
    storageLocation?: string | null,
  ): Promise<PantryItemRecord | null> {
    const scope = this.scopeWhere(userId);
    return this.updateByScope(scope, pantryId, name, quantity, unit, have, purchasedAt, openedAt, expiresAt, storageLocation);
  }

  updateForHousehold(
    householdId: number,
    pantryId: number,
    name?: string,
    quantity?: number | null,
    unit?: string | null,
    have?: boolean,
    purchasedAt?: string | null,
    openedAt?: string | null,
    expiresAt?: string | null,
    storageLocation?: string | null,
  ): Promise<PantryItemRecord | null> {
    return this.updateByScope(this.scopeWhere(undefined, householdId), pantryId, name, quantity, unit, have, purchasedAt, openedAt, expiresAt, storageLocation);
  }

  private async updateByScope(
    scope: Prisma.Sql,
    pantryId: number,
    name?: string,
    quantity?: number | null,
    unit?: string | null,
    have?: boolean,
    purchasedAt?: string | null,
    openedAt?: string | null,
    expiresAt?: string | null,
    storageLocation?: string | null,
  ): Promise<PantryItemRecord | null> {
    const current = await this.findByScope(scope, pantryId);
    if (!current) return null;
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE pantry_items
      SET name = ${name ?? current.name},
           quantity = ${quantity === undefined ? current.quantity : quantity},
           unit = ${unit === undefined ? current.unit : unit},
           have = ${have ?? current.have},
           purchased_at = ${purchasedAt === undefined ? current.purchased_at : purchasedAt},
           opened_at = ${openedAt === undefined ? current.opened_at : openedAt},
           expires_at = ${expiresAt === undefined ? current.expires_at : expiresAt},
           storage_location = ${storageLocation === undefined ? current.storage_location : storageLocation},
           updated_at = CURRENT_TIMESTAMP
       WHERE ${scope} AND pantry_id = ${pantryId}
    `);
    return this.findByScope(scope, pantryId);
  }

  async remove(userId: number, pantryId: number): Promise<boolean> {
    return this.removeByScope(this.scopeWhere(userId), pantryId);
  }

  importCheckedShoppingItems(userId: number): Promise<ShoppingListPantryImportResult> {
    return this.importCheckedShoppingItemsByScope(
      Prisma.sql`user_id = ${userId}`,
      Prisma.sql`user_id = ${userId}`,
      Prisma.sql`user_id, household_id`,
      Prisma.sql`${userId}, NULL`,
    );
  }

  removeForHousehold(householdId: number, pantryId: number): Promise<boolean> {
    return this.removeByScope(this.scopeWhere(undefined, householdId), pantryId);
  }

  importCheckedShoppingItemsForHousehold(householdId: number): Promise<ShoppingListPantryImportResult> {
    return this.importCheckedShoppingItemsByScope(
      Prisma.sql`household_id = ${householdId}`,
      Prisma.sql`household_id = ${householdId}`,
      Prisma.sql`user_id, household_id`,
      Prisma.sql`NULL, ${householdId}`,
    );
  }

  private async importCheckedShoppingItemsByScope(
    shoppingScope: Prisma.Sql,
    pantryScope: Prisma.Sql,
    ownerColumns: Prisma.Sql,
    ownerValues: Prisma.Sql,
  ): Promise<ShoppingListPantryImportResult> {
    return this.prisma.$transaction(async (tx) => {
      const shoppingItems = await tx.$queryRaw<Array<{ item_id: number; label: string; quantity: string | null }>>(Prisma.sql`
        SELECT item_id, label, quantity
        FROM shopping_list_items
        WHERE ${shoppingScope} AND checked = TRUE
        ORDER BY created_at ASC, item_id ASC
        FOR UPDATE
      `);
      const pantryRows = await tx.$queryRaw<Array<{ pantry_id: number; name: string; have: boolean; quantity: number | string | null; unit: string | null }>>(Prisma.sql`
        SELECT pantry_id, name, have, quantity, unit
        FROM pantry_items
        WHERE ${pantryScope}
        FOR UPDATE
      `);
      const pantryItems = pantryRows.map((item) => ({ ...item, quantity: item.quantity === null ? null : Number(item.quantity) }));
      const skippedItems: ShoppingListPantryImportSkipped[] = [];
      let importedItems = 0;

      for (const shoppingItem of shoppingItems) {
        const parsed = parseShoppingListQuantity(shoppingItem.quantity);
        if (!parsed) {
          skippedItems.push({
            item_id: Number(shoppingItem.item_id),
            label: shoppingItem.label,
            quantity: shoppingItem.quantity,
            reason: 'quantity_or_unit_required',
          });
          continue;
        }

        const pantryItem = pantryItems.find((item) => normalizeIngredientName(item.name) === normalizeIngredientName(shoppingItem.label));
        if (pantryItem) {
          const pantryUnit = normalizePantryUnit(pantryItem.unit);
          if (pantryItem.quantity !== null && pantryUnit) {
            const quantityToAdd = convertQuantity(parsed.quantity, parsed.unit, pantryUnit);
            if (quantityToAdd === null) {
              skippedItems.push({
                item_id: Number(shoppingItem.item_id),
                label: shoppingItem.label,
                quantity: shoppingItem.quantity,
                reason: 'pantry_unit_conflict',
              });
              continue;
            }
            await tx.$executeRaw(Prisma.sql`
              UPDATE pantry_items
              SET quantity = quantity + ${quantityToAdd}, have = TRUE, purchased_at = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
              WHERE ${pantryScope} AND pantry_id = ${pantryItem.pantry_id}
            `);
            pantryItem.quantity += quantityToAdd;
          } else {
            await tx.$executeRaw(Prisma.sql`
              UPDATE pantry_items
              SET quantity = ${parsed.quantity}, unit = ${parsed.unit}, have = TRUE, purchased_at = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
              WHERE ${pantryScope} AND pantry_id = ${pantryItem.pantry_id}
            `);
            pantryItem.quantity = parsed.quantity;
            pantryItem.unit = parsed.unit;
          }
        } else {
          const inserted = await tx.$queryRaw<{ pantry_id: number }[]>(Prisma.sql`
            INSERT INTO pantry_items (${ownerColumns}, name, quantity, unit, have, purchased_at)
            VALUES (${ownerValues}, ${shoppingItem.label}, ${parsed.quantity}, ${parsed.unit}, TRUE, CURRENT_DATE)
            RETURNING pantry_id
          `);
          pantryItems.push({
            pantry_id: Number(inserted[0].pantry_id),
            name: shoppingItem.label,
            have: true,
            quantity: parsed.quantity,
            unit: parsed.unit,
          });
        }

        await tx.$executeRaw(Prisma.sql`
          DELETE FROM shopping_list_items
          WHERE ${shoppingScope} AND item_id = ${shoppingItem.item_id}
        `);
        importedItems += 1;
      }

      return { imported_items: importedItems, skipped_items: skippedItems };
    });
  }

  private removeByScope(scope: Prisma.Sql, pantryId: number): Promise<boolean> {
    return this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM pantry_items WHERE ${scope} AND pantry_id = ${pantryId}
    `).then((count) => count > 0);
  }

  private listByScope(scope: Prisma.Sql): Promise<PantryItemRecord[]> {
    return this.prisma.$queryRaw<Array<PantryItemRecord & { quantity: number | string | null }>>(Prisma.sql`
      SELECT pantry_id, user_id, household_id, name, have, quantity, unit, purchased_at, opened_at, expires_at, storage_location, updated_at
      FROM pantry_items
      WHERE ${scope}
      ORDER BY have DESC, LOWER(name) ASC, pantry_id ASC
    `).then((rows) => rows.map((row) => this.toRecord(row)));
  }

  private async findByScope(scope: Prisma.Sql, pantryId: number): Promise<PantryItemRecord | null> {
    const rows = await this.prisma.$queryRaw<Array<PantryItemRecord & { quantity: number | string | null }>>(Prisma.sql`
      SELECT pantry_id, user_id, household_id, name, have, quantity, unit, purchased_at, opened_at, expires_at, storage_location, updated_at
      FROM pantry_items WHERE ${scope} AND pantry_id = ${pantryId}
    `);
    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  private scopeWhere(userId?: number, householdId?: number): Prisma.Sql {
    return householdId === undefined ? Prisma.sql`user_id = ${userId}` : Prisma.sql`household_id = ${householdId}`;
  }

  private toRecord(row: PantryItemRecord & { quantity: number | string | null }): PantryItemRecord {
    return { ...row, quantity: row.quantity === null ? null : Number(row.quantity) };
  }
}
