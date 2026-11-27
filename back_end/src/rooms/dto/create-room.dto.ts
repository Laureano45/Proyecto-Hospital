import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  MaxLength
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MaxLength(20)
  roomNumber: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
