import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import request from 'supertest';
import { createValidationPipe } from '../../bootstrap/validation.bootstrap';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PreferencesController } from './preferences.controller';
import {
  FoodPreferencesRecord,
  PreferencesRepository,
  PreferencesRepositoryPort,
} from './preferences.repository';
import { PreferencesService } from './preferences.service';
import { UpdateFoodPreferencesDto } from './dto/update-food-preferences.dto';

const emptyPreferences: FoodPreferencesRecord = {
  diet: null,
  avoidedAllergens: [],
  dislikedIngredients: [],
  preferredCuisines: [],
  cookingSkill: null,
  maxWeekdayCookMinutes: null,
  defaultServings: null,
  maxCaloriesPerServing: null,
  minProteinGrams: null,
  strictDislikes: null,
};

const savedPreferences: FoodPreferencesRecord = {
  ...emptyPreferences,
  diet: 'vegan',
  cookingSkill: 'intermediate',
  maxWeekdayCookMinutes: 30,
  defaultServings: 2,
  maxCaloriesPerServing: 650,
  minProteinGrams: 30,
  strictDislikes: false,
  avoidedAllergens: ['peanuts'],
  dislikedIngredients: ['cilantro', 'olives'],
  preferredCuisines: ['Vietnamese', 'Japanese'],
};

describe('PreferencesService', () => {
  const repository: jest.Mocked<PreferencesRepositoryPort> = {
    findByUserId: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns API defaults when the user has no stored preferences', async () => {
    repository.findByUserId.mockResolvedValue(emptyPreferences);
    const service = new PreferencesService(repository);

    await expect(service.get(7)).resolves.toEqual({
      diet: null,
      avoidedAllergens: [],
      dislikedIngredients: [],
      preferredCuisines: [],
      cookingSkill: null,
      maxWeekdayCookMinutes: null,
      defaultServings: 2,
      maxCaloriesPerServing: null,
      minProteinGrams: null,
      strictDislikes: false,
    });
  });

  it('trims and deduplicates child values before replacing preferences', async () => {
    repository.replace.mockResolvedValue(savedPreferences);
    const service = new PreferencesService(repository);

    await service.replace(7, {
      diet: ' vegan ',
      avoidedAllergens: [' peanuts ', 'peanuts', ''],
      dislikedIngredients: [' cilantro ', 'olives', 'cilantro'],
      preferredCuisines: [' Vietnamese ', 'Japanese', 'Vietnamese'],
      cookingSkill: ' intermediate ',
      maxWeekdayCookMinutes: 30,
      defaultServings: 2,
      maxCaloriesPerServing: 650,
      minProteinGrams: 30,
      strictDislikes: false,
    });

    expect(repository.replace).toHaveBeenCalledWith(7, {
      diet: 'vegan',
      avoidedAllergens: ['peanuts'],
      dislikedIngredients: ['cilantro', 'olives'],
      preferredCuisines: ['Vietnamese', 'Japanese'],
      cookingSkill: 'intermediate',
      maxWeekdayCookMinutes: 30,
      defaultServings: 2,
      maxCaloriesPerServing: 650,
      minProteinGrams: 30,
      strictDislikes: false,
    });
  });

  it('rejects a servings value outside the supported range', async () => {
    const errors = await validate(
      plainToInstance(UpdateFoodPreferencesDto, { defaultServings: 25 }),
    );

    expect(errors.some((error) => error.property === 'defaultServings')).toBe(true);
  });

  it('rejects nutrition values outside their supported bounds', async () => {
    const errors = await validate(
      plainToInstance(UpdateFoodPreferencesDto, {
        maxCaloriesPerServing: 99,
        minProteinGrams: 301,
      }),
    );

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['maxCaloriesPerServing', 'minProteinGrams']),
    );
  });

  it('rejects an avoided allergen list that exceeds the input bound', async () => {
    const errors = await validate(
      plainToInstance(UpdateFoodPreferencesDto, {
        avoidedAllergens: Array.from({ length: 33 }, (_, index) => `allergen-${index}`),
      }),
    );

    expect(errors.some((error) => error.property === 'avoidedAllergens')).toBe(true);
  });

  it('uses the authenticated actor instead of a client-supplied user id', async () => {
    const service = {
      get: jest.fn().mockResolvedValue(savedPreferences),
      replace: jest.fn().mockResolvedValue(savedPreferences),
    };
    const controller = new PreferencesController(service);
    const dto = { userId: 99, defaultServings: 2 } as UpdateFoodPreferencesDto;

    await controller.replace({ id: 7, email: 'ada@example.com' }, dto);

    expect(service.replace).toHaveBeenCalledWith(7, dto);
  });

  it('uses the authenticated actor for reads', async () => {
    const service = {
      get: jest.fn().mockResolvedValue(savedPreferences),
      replace: jest.fn(),
    };
    const controller = new PreferencesController(service);

    await controller.get({ id: 7, email: 'ada@example.com' });

    expect(service.get).toHaveBeenCalledWith(7);
  });
});

describe('PreferencesRepository', () => {
  it('reads scalar and child values for one user', async () => {
    const prisma = {
      userFoodPreference: {
        findUnique: jest.fn().mockResolvedValue({
          diet: 'vegan',
          cookingSkill: 'intermediate',
          maxWeekdayCookMinutes: 30,
          defaultServings: 2,
          maxCaloriesPerServing: 650,
          minProteinGrams: 30,
          strictDislikes: false,
        }),
      },
      userAvoidedAllergen: { findMany: jest.fn().mockResolvedValue([{ allergen: 'peanuts' }]) },
      userDislikedIngredient: { findMany: jest.fn().mockResolvedValue([{ ingredientName: 'cilantro' }, { ingredientName: 'olives' }]) },
      userCuisinePreference: { findMany: jest.fn().mockResolvedValue([{ cuisine: 'Vietnamese' }, { cuisine: 'Japanese' }]) },
    };
    const repository = new PreferencesRepository(prisma as never);

    await expect(repository.findByUserId(7)).resolves.toEqual(savedPreferences);
    expect(prisma.userFoodPreference.findUnique).toHaveBeenCalledWith({ where: { userId: 7 } });
  });

  it('replaces scalar and child values inside one transaction', async () => {
    const transaction = {
      userFoodPreference: { upsert: jest.fn().mockResolvedValue({}) },
      userAvoidedAllergen: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userDislikedIngredient: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userCuisinePreference: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback: (tx: typeof transaction) => Promise<void>) => callback(transaction)),
      userFoodPreference: { findUnique: jest.fn().mockResolvedValue({}) },
      userAvoidedAllergen: { findMany: jest.fn().mockResolvedValue([]) },
      userDislikedIngredient: { findMany: jest.fn().mockResolvedValue([]) },
      userCuisinePreference: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const repository = new PreferencesRepository(prisma as never);

    await repository.replace(7, {
      diet: 'vegan',
      avoidedAllergens: ['peanuts'],
      dislikedIngredients: ['cilantro'],
      preferredCuisines: ['Vietnamese'],
      cookingSkill: 'intermediate',
      maxWeekdayCookMinutes: 30,
      defaultServings: 2,
      maxCaloriesPerServing: 650,
      minProteinGrams: 30,
      strictDislikes: false,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.userFoodPreference.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.userAvoidedAllergen.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(transaction.userAvoidedAllergen.createMany).toHaveBeenCalledWith({
      data: [{ userId: 7, allergen: 'peanuts' }],
    });
    expect(transaction.userDislikedIngredient.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    expect(transaction.userCuisinePreference.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
  });

  it('rejects a failed transactional write without returning a replacement', async () => {
    const transaction = {
      userFoodPreference: { upsert: jest.fn().mockResolvedValue({}) },
      userAvoidedAllergen: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockRejectedValue(new Error('transaction write failed')),
      },
      userDislikedIngredient: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      userCuisinePreference: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback: (tx: typeof transaction) => Promise<void>) => callback(transaction)),
      userFoodPreference: { findUnique: jest.fn() },
      userAvoidedAllergen: { findMany: jest.fn() },
      userDislikedIngredient: { findMany: jest.fn() },
      userCuisinePreference: { findMany: jest.fn() },
    };
    const repository = new PreferencesRepository(prisma as never);

    await expect(
      repository.replace(7, {
        diet: 'vegan',
        avoidedAllergens: ['peanuts'],
        dislikedIngredients: ['cilantro'],
        preferredCuisines: ['Vietnamese'],
        cookingSkill: 'intermediate',
        maxWeekdayCookMinutes: 30,
        defaultServings: 2,
        maxCaloriesPerServing: 650,
        minProteinGrams: 30,
        strictDislikes: false,
      }),
    ).rejects.toThrow('transaction write failed');

    expect(prisma.userFoodPreference.findUnique).not.toHaveBeenCalled();
  });
});

describe('Preferences HTTP validation boundary', () => {
  const service = {
    get: jest.fn(),
    replace: jest.fn(),
  };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PreferencesController],
      providers: [{ provide: PreferencesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            id: 7,
            email: 'ada@example.com',
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('rejects a client-supplied user id at the configured validation boundary', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/users/me/food-preferences')
      .send({ defaultServings: 2, userId: 99 })
      .expect(400);

    expect(service.replace).not.toHaveBeenCalled();
  });
});
