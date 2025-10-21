import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../enums/day-of-week.enum';

class FacilityPreviewDto {
    @ApiProperty({ example: 5 })
    id: number;

    @ApiProperty({ example: { en: 'Al-Majed pool', ar: 'مسبح المجد' } })
    name: string;
}

export class OwnerApprovedReservationDto {
    @ApiProperty({ example: 42 })
    id: number;

    @ApiProperty({ example: 6 })
    userId: number;

    @ApiProperty({ example: 6 })
    userName: string;

    @ApiProperty({ example: '2025-08-25' })
    date: string;

    @ApiProperty({ example: 'monday', enum: DayOfWeek })
    dayOfWeek: DayOfWeek;

    @ApiProperty({ example: '11:45:00' })
    startTime: string;

    @ApiProperty({ example: '13:00:00' })
    endTime: string;

    @ApiProperty({ example: 'confirmed' })
    status: string;

    @ApiProperty({ example: 31.25, description: 'reservation price in dollars' })
    price: number;

    @ApiProperty({ type: FacilityPreviewDto })
    facility: FacilityPreviewDto;

    @ApiProperty({ example: 10, nullable: true })
    availabilityId: number | null;

    @ApiProperty({ example: 8, nullable: true })
    slotId: number | null;
}

export class GetApprovedReservationsResponseDto {
    @ApiProperty({ type: OwnerApprovedReservationDto, isArray: true })
    reservations: OwnerApprovedReservationDto[];
}
