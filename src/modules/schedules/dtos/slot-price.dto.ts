import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class SlotPriceDto {
    @ApiProperty({ example: 15.5, description: 'New slot price in dollars' })
    @IsNumber()
    @IsPositive()
    price: number;
}
