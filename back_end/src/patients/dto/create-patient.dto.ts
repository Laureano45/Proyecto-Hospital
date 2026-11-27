import {
  IsString,
  IsEmail,
  Length,
  IsOptional,
  IsDateString,
  MaxLength,
  IsIn,
} from 'class-validator';

export class CreatePatientDto {

  @IsString()
  @Length(2, 100)
  firstName: string;

  @IsString()
  @Length(2, 100)
  lastName: string;

  @IsString()
  @Length(7, 20)
  dni: string;

  @IsString()
  @Length(6, 30)
  phone: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsIn(['masculino', 'femenino', 'intersexual', 'no_especificado'])
  biologicalSex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @Length(6, 30)
  emergencyContactPhone?: string;
}
