import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PublicUser, UsersService } from '../users/users.service';

export type AuthResponse = {
  user: PublicUser;
  token: string;
  message: string;
};

type AuthUsersPort = Pick<
  UsersService,
  'findByEmailWithPassword' | 'create' | 'toPublicUser' | 'findById'
>;
type AuthJwtPort = Pick<JwtService, 'signAsync' | 'verifyAsync'>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: AuthUsersPort,
    @Inject(JwtService) private readonly jwtService: AuthJwtPort,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const user = await this.usersService.create({
      fullName: `${dto.name.first} ${dto.name.last}`.trim(),
      email: dto.email,
      password: dto.password,
    });
    return this.withToken(user, 'Signed up!');
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    return this.withToken(this.usersService.toPublicUser(user), 'Logged in!');
  }

  async getUserFromToken(token: string): Promise<PublicUser> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: number;
        user_id?: number;
      }>(token, {
        secret: this.configService?.get<string>('auth.jwtSecret'),
      });
      const id = payload.sub ?? payload.user_id;
      if (!id) throw new Error('JWT subject is required');
      return this.usersService.findById(id);
    } catch {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'JWT is invalid or expired',
      });
    }
  }

  getMe(userId: number): Promise<PublicUser> {
    return this.usersService.findById(userId);
  }

  private withToken(user: PublicUser, message: string): Promise<AuthResponse> {
    return this.jwtService
      .signAsync({ sub: user.user_id, user_id: user.user_id, email: user.email })
      .then((token) => ({ user, token, message }));
  }
}
