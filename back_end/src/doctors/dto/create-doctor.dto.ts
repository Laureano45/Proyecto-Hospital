
import {
  IsString,
  Length
} from 'class-validator';

export class CreateDoctorDto {

  @IsString()
  @Length(2, 100)
  firstName: string;

  @IsString()
  @Length(2, 100)
  lastName: string;

  @IsString()
  @Length(2, 100)
  specialty: string;

  @IsString()
  @Length(3, 50)
  licenseNumber: string;
}
