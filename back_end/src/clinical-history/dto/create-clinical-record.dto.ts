import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  MaxLength,
  IsNotEmpty
} from 'class-validator';

export class CreateClinicalRecordDto {

  @IsInt()
  @Min(1)
  patientId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  diagnosis: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  observations?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  correctsRecordId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  correctionReason?: string;
}