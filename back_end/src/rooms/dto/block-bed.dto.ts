import {
  IsString,
  IsNotEmpty,
  MaxLength
} from 'class-validator';

export class BlockBedDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
