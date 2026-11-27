import {
  IsInt,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {

  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  serviceId: number;
}
