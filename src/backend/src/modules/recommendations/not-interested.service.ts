import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  NOT_INTERESTED_REPOSITORY,
  NotInterestedRepositoryPort,
} from './not-interested.repository';

@Injectable()
export class NotInterestedService {
  constructor(
    @Inject(NOT_INTERESTED_REPOSITORY)
    private readonly repository: NotInterestedRepositoryPort,
  ) {}

  async add(userId: number, recipeId: number): Promise<{ message: string }> {
    if (!(await this.repository.add(userId, recipeId))) {
      throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Published recipe not found' });
    }
    return { message: 'Recipe marked not interested' };
  }

  async remove(userId: number, recipeId: number): Promise<{ message: string }> {
    await this.repository.remove(userId, recipeId);
    return { message: 'Recipe removed from not interested' };
  }
}

export type NotInterestedServicePort = Pick<NotInterestedService, 'add' | 'remove'>;
