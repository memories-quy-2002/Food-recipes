import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserData, UserRepository, UsersRepository } from './users.repository';

export type PublicUser = {
  user_id: number;
  full_name: string;
  email: string;
  created_on: Date;
  last_login: Date | null;
  phone: string | null;
  address: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository) private readonly repository: UserRepository,
  ) {}

  async create(data: CreateUserData): Promise<PublicUser> {
    const email = data.email.trim().toLowerCase();
    if (await this.repository.findByEmail(email)) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });
    }

    try {
      const password = await bcrypt.hash(data.password, 10);
      return this.toPublicUser(
        await this.repository.create({ ...data, email, password }),
      );
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email is already registered',
        });
      }
      throw error;
    }
  }

  async findById(id: number): Promise<PublicUser> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    return this.toPublicUser(user);
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository.findByEmail(email.trim().toLowerCase());
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<PublicUser> {
    try {
      return this.toPublicUser(await this.repository.updateProfile(userId, dto));
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }
      throw error;
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException({
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'The current password is incorrect',
      });
    }

    await this.repository.updatePassword(
      userId,
      await bcrypt.hash(dto.newPassword, 10),
    );
  }

  toPublicUser(user: User): PublicUser {
    return {
      user_id: user.id,
      full_name: user.fullName,
      email: user.email,
      created_on: user.createdOn,
      last_login: user.lastLogin,
      phone: user.phone,
      address: user.address,
    };
  }
}
