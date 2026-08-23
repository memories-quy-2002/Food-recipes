import { Inject, Injectable } from '@nestjs/common';
import {
  CategoriesResult,
  MealsResult,
  TaxonomyRepository,
  TaxonomyRepositoryPort,
} from './taxonomy.repository';

export interface TaxonomyServicePort {
  listCategories(): Promise<CategoriesResult>;
  listMeals(): Promise<MealsResult>;
}

@Injectable()
export class TaxonomyService implements TaxonomyServicePort {
  constructor(
    @Inject(TaxonomyRepository)
    private readonly repository: TaxonomyRepositoryPort,
  ) {}

  listCategories(): Promise<CategoriesResult> {
    return this.repository.listCategories();
  }

  listMeals(): Promise<MealsResult> {
    return this.repository.listMeals();
  }
}
