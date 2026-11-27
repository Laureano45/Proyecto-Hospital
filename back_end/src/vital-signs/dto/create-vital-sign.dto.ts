
import {
  IsInt,
  IsNumber,
  Min,
  Max
} from 'class-validator';

export class CreateVitalSignDto {

  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  admissionId: number;

  // Presión arterial sistólica (mmHg)
  @IsInt()
  @Min(40)
  @Max(300)
  bloodPressureSystolic: number;

  // Presión arterial diastólica (mmHg)
  @IsInt()
  @Min(20)
  @Max(200)
  bloodPressureDiastolic: number;

  // Frecuencia cardíaca (latidos por minuto)
  @IsInt()
  @Min(20)
  @Max(250)
  heartRate: number;

  // Temperatura corporal (°C)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(25)
  @Max(45)
  temperature: number;
}
