import {
  IsInt,
  IsDateString,
  Min
} from 'class-validator';

export class CreateOverbookingDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  doctorId: number;

  @IsDateString()
  appointmentDate: string;

  @IsInt()
  @Min(1)
  beforeAppointmentId: number;

  @IsInt()
  @Min(1)
  afterAppointmentId: number;
}