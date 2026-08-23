import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../types/auth-user.type';
import { UsersService } from '../../users/users.service';

type JwtPayload = {
  sub?: number;
  user_id?: number;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const id = payload.sub ?? payload.user_id;
    if (!id) {
      throw new Error('JWT subject is required');
    }
    const user = await this.usersService.findById(id);
    return { id: user.user_id, email: user.email, role: user.role };
  }
}
