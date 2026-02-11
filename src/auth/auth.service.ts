import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

import { UsersService } from '../users/users.service';
import { Payload } from './models/payload.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    const passwordMatch = await bcrypt.compare(pass, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    return user;
  }

  generateAccessToken(user: User) {
    const payload: Payload = { email: user.email, sub: user._id.toString() };
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }
}
