import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsDateString,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class CreateMedicationOrderDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  admissionId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  medicationName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosage: string;

  @IsInt()
  @Min(1)
  frequencyHours: number;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}
