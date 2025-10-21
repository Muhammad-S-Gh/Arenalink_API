import { ApiProperty } from '@nestjs/swagger';

export class BlockSlotResponseDto {
    @ApiProperty({ example: 12 })
    id: number;

    @ApiProperty({ example: 5 })
    facilityId: number;

    @ApiProperty({ example: 'Al-Majed pool' })
    facilityName: string;

    @ApiProperty({ example: 3 })
    availabilityId: number;

    @ApiProperty({ example: 8 })    
    slotId: number;

    @ApiProperty({ example: '2025-09-01' })
    date: string;

    @ApiProperty({ example: 'tuesday' })
    dayOfWeek: string;

    @ApiProperty({ example: '14:00:00' })
    startTime: string;

    @ApiProperty({ example: '15:00:00' })
    endTime: string;

    @ApiProperty({ example: 'blocked' })
    status: string;
}
