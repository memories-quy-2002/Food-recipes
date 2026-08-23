import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
}

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(
    userId: number,
    data: { name: string; phoneNumber?: string; address?: string },
  ): Promise<User>;
  updatePassword(userId: number, password: string): Promise<void>;
  markEmailVerified?(userId: number): Promise<void>;
}

@Injectable()
export class UsersRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        createdOn: new Date(),
        lastLogin: new Date(),
      },
    });
  }

  updateProfile(
    userId: number,
    data: { name: string; phoneNumber?: string; address?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.name,
        phone: data.phoneNumber ?? null,
        address: data.address ?? null,
      },
    });
  }

  async updatePassword(userId: number, password: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { password } });
  }

  async markEmailVerified(userId: number): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  }
}
