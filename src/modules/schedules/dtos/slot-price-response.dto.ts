import { ApiProperty } from '@nestjs/swagger';

export class SlotPriceResponseDto {
    @ApiProperty({ example: 8 }) slotId: number;
    @ApiProperty({ example: 'Al-Majed pool' }) facilityName: string;
    @ApiProperty({ example: 5 }) facilityId: number;
    @ApiProperty({ example: 3 }) availabilityId: number;
    @ApiProperty({ example: 'tuesday' }) dayOfWeek: string;
    @ApiProperty({ example: '14:00:00' }) startTime: string;
    @ApiProperty({ example: '15:00:00' }) endTime: string;
    @ApiProperty({ example: 10.5 }) price: number;
}
