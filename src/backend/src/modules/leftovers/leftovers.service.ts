import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeftoverDto } from './dto/create-leftover.dto';
import { LEFTOVERS_REPOSITORY, LeftoversRepositoryPort } from './leftovers.repository';

@Injectable()
export class LeftoversService {
  constructor(@Inject(LEFTOVERS_REPOSITORY) private readonly repository: LeftoversRepositoryPort) {}
  async list(userId: number, householdId: number | null = null) { return { items: await this.repository.listAvailable(userId, householdId) }; }
  async create(userId: number, dto: CreateLeftoverDto, householdId: number | null = null) {
    const history = await this.repository.findCompletedHistory(userId, dto.cookingHistoryId);
    if (!history) throw new NotFoundException({ code: 'COOKING_HISTORY_NOT_FOUND', message: 'Completed cooking history not found' });
    if (history.user_id !== userId) throw new ForbiddenException({ code: 'LEFTOVER_HISTORY_ACCESS_DENIED', message: 'You do not have access to this cooking history' });
    const expiresAt = new Date(dto.expiresAt);
    if (!Number.isInteger(dto.servings) || dto.servings < 1 || dto.servings > history.servings) throw new BadRequestException({ code: 'LEFTOVER_SERVINGS_INVALID', message: 'Leftover servings must be positive and no greater than cooked servings' });
    if (expiresAt <= history.completed_at) throw new BadRequestException({ code: 'LEFTOVER_EXPIRY_INVALID', message: 'Expiry must be after preparation' });
    if (history.recipe_status !== 'published' && history.recipe_user_id !== userId) throw new ForbiddenException({ code: 'LEFTOVER_RECIPE_ACCESS_DENIED', message: 'Recipe is not published or owned by you' });
    const existing = await this.repository.findByHistory(dto.cookingHistoryId, userId, householdId);
    if (existing && (existing.user_id !== (householdId === null ? userId : null) || existing.household_id !== householdId)) throw new ForbiddenException({ code: 'LEFTOVER_OWNERSHIP_CONFLICT', message: 'This cooking history already belongs to another leftover owner' });
    const leftover = existing ?? await this.repository.create(userId, householdId, history.history_id, history.recipe_id, history.servings, dto.servings, expiresAt);
    if (!leftover) throw new ForbiddenException({ code: 'LEFTOVER_OWNERSHIP_CONFLICT', message: 'This cooking history already belongs to another leftover owner' });
    return { leftover };
  }
}
export type LeftoversServicePort = Pick<LeftoversService, 'list' | 'create'>;
