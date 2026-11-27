import {
  IsInt,
  Min,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength
} from 'class-validator';

import { AdmissionType } from '../entities/admission-type.enum';

export class CreateAdmissionDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  roomId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  doctorId?: number;

  @IsOptional()
  @IsEnum(AdmissionType)
  admissionType?: AdmissionType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  initialDiagnosis?: string;
}