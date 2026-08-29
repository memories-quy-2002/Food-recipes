import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { RecommendationCandidate, RecommendationCandidatesRepositoryPort } from '../recommendations/recommendation-candidates.repository';
import type { RecommendationContextServicePort } from '../recommendations/recommendation-context.service';
import { RecommendationScorer } from '../recommendations/recommendation-scorer';
import { RECOMMENDATION_CANDIDATES_REPOSITORY, RECOMMENDATION_CONTEXT } from '../recommendations/recommendations.tokens';
import type { MealPlanSlot } from './dto/add-meal-plan-item.dto';
import type { FromMealPlanPreviewDto, GenerateMealPlanDto, MealPlanSlotRequestDto } from './dto/generate-meal-plan.dto';
import { PLANNING_REPOSITORY, type MealPlanRecord, type MealPlanItemRecord, type PlanningRepositoryPort } from './planning.repository';
import { workflowTelemetry } from '../../common/telemetry/workflow-telemetry.service';

export type MealPlanPreviewItem = {
  recipeId: number;
  recipeName: string;
  date: string;
  slot: MealPlanSlot;
  servings: number;
  locked: boolean;
  score: number;
  reasons: string[];
};

export type MealPlanPreview = {
  previewToken: string;
  name: string;
  from: string;
  to: string;
  targetMeals: number;
  items: MealPlanPreviewItem[];
};

export type GeneratedMealPlanResponse = {
  plan: MealPlanRecord;
  items: MealPlanItemRecord[];
};

type PreviewStoreEntry = {
  userId: number;
  preview: Omit<MealPlanPreview, 'previewToken'>;
  expiresAt: number;
};

type MealPlanPersistencePort = Pick<PlanningRepositoryPort, 'createPlan' | 'addPlanItem'>;

const PREVIEW_TTL_MS = 10 * 60 * 1000;
const DEFAULT_SERVINGS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

const dayRange = (from: string, to: string): string[] => {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  const dates: string[] = [];
  for (let current = start.getTime(); current <= end.getTime(); current += DAY_MS) {
    dates.push(new Date(current).toISOString().slice(0, 10));
  }
  return dates;
};

const slotKey = (date: string, slot: MealPlanSlot): string => `${date}:${slot}`;

@Injectable()
export class MealPlanGeneratorService {
  private readonly previews = new Map<string, PreviewStoreEntry>();

  constructor(
    @Inject(RECOMMENDATION_CONTEXT)
    private readonly contextService: RecommendationContextServicePort,
    @Inject(RECOMMENDATION_CANDIDATES_REPOSITORY)
    private readonly candidatesRepository: RecommendationCandidatesRepositoryPort,
    private readonly scorer: RecommendationScorer,
    @Inject(PLANNING_REPOSITORY)
    private readonly planningRepository: MealPlanPersistencePort,
  ) {}

  async generatePreview(userId: number, dto: GenerateMealPlanDto): Promise<MealPlanPreview> {
    const startedAt = Date.now();
    this.validateRange(dto.from, dto.to);
    const slots = this.requestedSlots(dto);
    if (slots.length !== dto.targetMeals) throw this.impossible();

    const [context, candidates] = await Promise.all([
      this.contextService.build(userId),
      this.candidatesRepository.listPublished(),
    ]);
    const candidateById = new Map(candidates.map((candidate) => [candidate.recipeId, candidate]));
    const lockedBySlot = new Map((dto.lockedItems ?? []).map((item) => [slotKey(item.date, item.slot), item]));
    const lockedRecipeIds = new Set([...lockedBySlot.values()].map((item) => item.recipeId));
    const selectedRecipeIds = new Set<number>();
    const items: MealPlanPreviewItem[] = [];

    for (const requestedSlot of slots) {
      const key = slotKey(requestedSlot.date, requestedSlot.slot);
      const locked = lockedBySlot.get(key);
      const servings = locked?.servings ?? requestedSlot.servings ?? DEFAULT_SERVINGS;
      if (locked) {
        const lockedCandidate = candidateById.get(locked.recipeId);
        if (!lockedCandidate || this.scorer.score(lockedCandidate, context, { excludeOwnRecipe: false }).excluded) {
          throw this.impossible();
        }
        const score = this.scorer.score(lockedCandidate, context, { excludeOwnRecipe: false });
        items.push(this.toPreviewItem(lockedCandidate, requestedSlot.date, requestedSlot.slot, servings, true, score.score, score.reasons));
        selectedRecipeIds.add(lockedCandidate.recipeId);
        continue;
      }

      const chosen = this.chooseCandidate(
        candidates,
        context,
        selectedRecipeIds,
        lockedRecipeIds,
        new Set(dto.excludedRecipeIds ?? []),
      );
      if (!chosen) throw this.impossible();
      items.push(this.toPreviewItem(chosen.candidate, requestedSlot.date, requestedSlot.slot, servings, false, chosen.score, chosen.reasons));
      selectedRecipeIds.add(chosen.candidate.recipeId);
    }

    const preview = {
      name: dto.name.trim(),
      from: dto.from,
      to: dto.to,
      targetMeals: dto.targetMeals,
      items,
    };
    this.pruneExpiredPreviews();
    const previewToken = randomBytes(32).toString('base64url');
    this.previews.set(previewToken, { userId, preview, expiresAt: Date.now() + PREVIEW_TTL_MS });
    workflowTelemetry.record('meal_plan.generate', { surface: 'planner', candidate_count: candidates.length, result_count: items.length, duration: Date.now() - startedAt, status: 'ok' });
    return { previewToken, ...preview };
  }

  async createFromPreview(userId: number, dto: FromMealPlanPreviewDto): Promise<GeneratedMealPlanResponse> {
    this.pruneExpiredPreviews();
    const stored = this.previews.get(dto.previewToken);
    if (!stored || stored.userId !== userId) throw this.previewInvalid();

    const [context, candidates] = await Promise.all([
      this.contextService.build(userId),
      this.candidatesRepository.listPublished(),
    ]);
    const candidateById = new Map(candidates.map((candidate) => [candidate.recipeId, candidate]));
    for (const item of stored.preview.items) {
      const candidate = candidateById.get(item.recipeId);
      if (!candidate || this.scorer.score(candidate, context, { excludeOwnRecipe: false }).excluded) {
        throw this.impossible();
      }
    }

    const plan = await this.planningRepository.createPlan(
      userId,
      (dto.name?.trim() || stored.preview.name),
      stored.preview.from,
      stored.preview.to,
    );
    const items: MealPlanItemRecord[] = [];
    for (const item of stored.preview.items) {
      const persisted = await this.planningRepository.addPlanItem(
        userId,
        plan.plan_id,
        item.recipeId,
        item.date,
        item.slot,
        item.servings,
      );
      if (!persisted) throw this.impossible();
      items.push(persisted);
    }
    this.previews.delete(dto.previewToken);
    return { plan, items };
  }

  private requestedSlots(dto: GenerateMealPlanDto): MealPlanSlotRequestDto[] {
    const requested = dto.slots?.map((slot) => ({ ...slot, servings: slot.servings ?? DEFAULT_SERVINGS })) ?? [];
    if (requested.some((slot) => !this.isWithinRange(slot.date, dto.from, dto.to))) throw this.impossible();
    const byKey = new Map(requested.map((slot) => [slotKey(slot.date, slot.slot), slot]));
    for (const locked of dto.lockedItems ?? []) {
      if (!this.isWithinRange(locked.date, dto.from, dto.to)) throw this.impossible();
      byKey.set(slotKey(locked.date, locked.slot), { date: locked.date, slot: locked.slot, servings: locked.servings ?? DEFAULT_SERVINGS });
    }
    if (!dto.slots) {
      const defaultSlots: MealPlanSlot[] = ['dinner', 'lunch', 'breakfast', 'snack'];
      for (const date of dayRange(dto.from, dto.to)) {
        for (const slot of defaultSlots) {
        if (byKey.size >= dto.targetMeals) break;
        byKey.set(slotKey(date, slot), { date, slot, servings: DEFAULT_SERVINGS });
        }
        if (byKey.size >= dto.targetMeals) break;
      }
    }
    const lockedKeys = new Set((dto.lockedItems ?? []).map((item) => slotKey(item.date, item.slot)));
    const lockedSlots = [...byKey.entries()].filter(([key]) => lockedKeys.has(key)).map(([, slot]) => slot);
    if (lockedSlots.length > dto.targetMeals) throw this.impossible();
    const unlockedSlots = [...byKey.entries()].filter(([key]) => !lockedKeys.has(key)).map(([, slot]) => slot);
    return [...lockedSlots, ...unlockedSlots].slice(0, dto.targetMeals);
  }

  private chooseCandidate(
    candidates: readonly RecommendationCandidate[],
    context: Awaited<ReturnType<RecommendationContextServicePort['build']>>,
    selectedRecipeIds: ReadonlySet<number>,
    lockedRecipeIds: ReadonlySet<number>,
    excludedRecipeIds: ReadonlySet<number>,
  ) {
    const ranked = candidates.flatMap((candidate) => {
      if (excludedRecipeIds.has(candidate.recipeId)) return [];
      const result = this.scorer.score(candidate, context, { excludeOwnRecipe: false });
      return result.excluded ? [] : [{ candidate, score: result.score, reasons: result.reasons }];
    });
    const unique = ranked.filter(({ candidate }) => !selectedRecipeIds.has(candidate.recipeId) && !lockedRecipeIds.has(candidate.recipeId));
    const withoutSelected = ranked.filter(({ candidate }) => !selectedRecipeIds.has(candidate.recipeId));
    const pool = unique.length ? unique : withoutSelected.length ? withoutSelected : ranked;
    return [...pool].sort((left, right) => {
      const leftScore = left.score - (selectedRecipeIds.has(left.candidate.recipeId) ? 0.2 : 0);
      const rightScore = right.score - (selectedRecipeIds.has(right.candidate.recipeId) ? 0.2 : 0);
      return rightScore - leftScore || left.candidate.recipeId - right.candidate.recipeId;
    })[0] ?? null;
  }

  private toPreviewItem(candidate: RecommendationCandidate, date: string, slot: MealPlanSlot, servings: number, locked: boolean, score: number, reasons: string[]): MealPlanPreviewItem {
    return {
      recipeId: candidate.recipeId,
      recipeName: candidate.recipeName ?? `Recipe ${candidate.recipeId}`,
      date,
      slot,
      servings,
      locked,
      score,
      reasons,
    };
  }

  private validateRange(from: string, to: string) {
    if (!this.isValidDate(from) || !this.isValidDate(to) || from > to || dayRange(from, to).length > 31) throw this.impossible();
  }

  private isWithinRange(value: string, from: string, to: string): boolean {
    return this.isValidDate(value) && value >= from && value <= to;
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  private pruneExpiredPreviews() {
    const now = Date.now();
    for (const [token, preview] of this.previews) if (preview.expiresAt <= now) this.previews.delete(token);
  }

  private impossible(): BadRequestException {
    return new BadRequestException({ code: 'MEAL_PLAN_GENERATION_IMPOSSIBLE', message: 'We could not generate a meal plan with those constraints' });
  }

  private previewInvalid(): BadRequestException {
    return new BadRequestException({ code: 'MEAL_PLAN_PREVIEW_INVALID', message: 'This meal plan preview is invalid or expired' });
  }
}
