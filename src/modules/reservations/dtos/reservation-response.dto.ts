import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../enums/reservation-status.enum';
import { Facility } from '../../../modules/facilities/entities/facility.entity';
import { DayOfWeek } from '../../../modules/schedules/enums/day-of-week.enum';

class FacilityPreviewDto {
    @ApiProperty({ example: 5 })
    id: number;

    @ApiProperty({ example: { en: 'Al-Majed pool', ar: 'مسبح المجد' } })
    name: string;
}

export class ReservationResponseDto {
    @ApiProperty({ example: 123 })
    id: number;

    @ApiProperty({ example: '2025-08-25' })
    date: string;

    @ApiProperty({ example: '2025-08-25' })
    dayOfWeek: DayOfWeek;

    @ApiProperty({ example: '14:00:00' })
    startTime: string;

    @ApiProperty({ example: '15:00:00' })
    endTime: string;

    @ApiProperty({ enum: ReservationStatus })
    status: ReservationStatus;

    @ApiProperty({ example: 25, description: 'Price in dollars' })
    price: number;

    @ApiProperty({ type: FacilityPreviewDto })
    facility: FacilityPreviewDto;

    @ApiProperty({ example: 10, nullable: true })
    availabilityId: number | null;

    @ApiProperty({ example: 8, nullable: true })
    slotId: number | null;
}
