import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Correo electrónico o contraseña incorrectos',
      );
    }  
    
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Esta cuenta se encuentra desactivada',
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password,
    );  

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Correo electrónico o contraseña incorrectos',
      );  
    }  

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      doctorId: user.doctor?.id ?? null,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctorId: user.doctor?.id ?? null,
      },
    };
  }
}
