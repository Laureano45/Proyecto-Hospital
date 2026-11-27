import {
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class SetSupplyStockDto {
  @IsInt()
  @Min(1)
  @Max(99)
  floor: number;

  @IsInt()
  @Min(0)
  quantity: number;
}
