
import {
  IsInt,
  IsDateString,
  IsString,
  Matches,
  Min
} from 'class-validator';

export class CreateAppointmentDto {

  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  doctorId: number;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  appointmentTime: string;
}
