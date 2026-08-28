import { ForbiddenException } from '@nestjs/common';
import { HouseholdAccessService } from './households/household-access.service';
import type { HouseholdMemberRecord, HouseholdsRepositoryPort } from './households/households.repository';
import { HouseholdPantryController } from './pantry/pantry.controller';
import type { PantryServicePort } from './pantry/pantry.service';
import { HouseholdPlanningController } from './planning/planning.controller';
import type { PlanningService } from './planning/planning.service';
import type { AuthUser } from './auth/types/auth-user.type';

type HouseholdPantryService = Pick<PantryServicePort, 'listForHousehold' | 'createForHousehold'>;
type HouseholdPlanningService = Pick<PlanningService, 'listPlansForHousehold' | 'createPlanForHousehold'>;

const pantryService: jest.Mocked<HouseholdPantryService> = {
  listForHousehold: jest.fn(),
  createForHousehold: jest.fn(),
};

const planningService: jest.Mocked<HouseholdPlanningService> = {
  listPlansForHousehold: jest.fn(),
  createPlanForHousehold: jest.fn(),
};

const repository: jest.Mocked<Pick<HouseholdsRepositoryPort, 'findMember'>> = {
  findMember: jest.fn(),
};

const memberUser: AuthUser = { id: 7, email: 'member@example.com' };
const viewerUser: AuthUser = { id: 8, email: 'viewer@example.com' };
const householdId = 42;

const memberRecord = (userId: number, household: number, role: HouseholdMemberRecord['role']): HouseholdMemberRecord => ({
  member_id: userId,
  household_id: household,
  user_id: userId,
  role,
});

describe('household kitchen controllers', () => {
  let pantryController: HouseholdPantryController;
  let planningController: HouseholdPlanningController;

  beforeEach(() => {
    jest.resetAllMocks();
    const access = new HouseholdAccessService(repository as unknown as HouseholdsRepositoryPort);
    pantryController = new HouseholdPantryController(pantryService as unknown as PantryServicePort, access);
    planningController = new HouseholdPlanningController(planningService as unknown as PlanningService, access);
  });

  it('allows a member to mutate household pantry and planning resources', async () => {
    repository.findMember.mockResolvedValue(memberRecord(memberUser.id, householdId, 'MEMBER'));
    const pantryDto = { name: 'Oats' };
    const planDto = { name: 'Weekend meals', from: '2026-08-28', to: '2026-08-30' };

    await pantryController.create(memberUser, householdId, pantryDto);
    await planningController.createPlan(memberUser, householdId, planDto);

    expect(pantryService.createForHousehold).toHaveBeenCalledWith(householdId, pantryDto);
    expect(planningService.createPlanForHousehold).toHaveBeenCalledWith(householdId, planDto);
  });

  it('allows a viewer to read both resources but rejects a viewer pantry mutation', async () => {
    repository.findMember.mockResolvedValue(memberRecord(viewerUser.id, householdId, 'VIEWER'));

    await pantryController.list(viewerUser, householdId);
    await planningController.listPlans(viewerUser, householdId, {});

    expect(pantryService.listForHousehold).toHaveBeenCalledWith(householdId);
    expect(planningService.listPlansForHousehold).toHaveBeenCalledWith(householdId, {});

    const mutation = pantryController.create(viewerUser, householdId, { name: 'Rice' });
    await expect(mutation).rejects.toBeInstanceOf(ForbiddenException);
    await expect(mutation).rejects.toMatchObject({ response: { code: 'HOUSEHOLD_ACCESS_DENIED' } });
    expect(pantryService.createForHousehold).not.toHaveBeenCalled();
  });

  it('denies a member from another household before the planning service is reached', async () => {
    repository.findMember.mockImplementation(async (userId, requestedHouseholdId) => (
      userId === memberUser.id && requestedHouseholdId === householdId
        ? memberRecord(memberUser.id, householdId, 'MEMBER')
        : null
    ));

    const request = planningController.listPlans(memberUser, 99, {});

    await expect(request).rejects.toMatchObject({ response: { code: 'HOUSEHOLD_ACCESS_DENIED' } });
    expect(repository.findMember).toHaveBeenCalledWith(memberUser.id, 99);
    expect(planningService.listPlansForHousehold).not.toHaveBeenCalled();
  });
});
