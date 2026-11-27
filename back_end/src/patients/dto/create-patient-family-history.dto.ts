    import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength
} from 'class-validator';

export class CreatePatientFamilyHistoryDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  relative: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  condition: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;
}