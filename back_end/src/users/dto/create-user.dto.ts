import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { Role } from '../roles.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(Role)
  role: Role;

  @ValidateIf(o => o.role === Role.MEDICO)
  @IsString()
  @IsNotEmpty()
  specialty?: string;

  @ValidateIf(o => o.role === Role.MEDICO)
  @IsString()
  @IsNotEmpty()
  licenseNumber?: string;
}
