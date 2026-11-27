import {
  IsString,
  Length,
  IsIn,
} from 'class-validator';

export class CreatePatientAllergyDto {

  @IsString()
  @Length(2, 150)
  allergen: string;

  @IsIn(['leve', 'moderada', 'grave'])
  severity: string;
}