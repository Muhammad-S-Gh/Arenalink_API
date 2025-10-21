import { ApiProperty } from '@nestjs/swagger';

class FacilityPreviewDto {
    @ApiProperty({ example: 5 })
    id: number;

    @ApiProperty({ example: { en: 'Al-Majed pool', ar: 'مسبح المجد' } })
    name: { en: string; ar: string };
}

class SlotPreviewDto {
    @ApiProperty({ example: 8 })
    id: number;
}

export class ReservationResponseDto {
    @ApiProperty({ example: 9 })
    id: number;

    @ApiProperty({ example: 6 })
    userId: number;

    @ApiProperty({ example: 8 })
    slotId: number;

    @ApiProperty({ example: '2025-08-25' })
    date: string;

    @ApiProperty({ example: 'monday' })
    dayOfWeek: string;

    @ApiProperty({ example: '11:45:00' })
    startTime: string;

    @ApiProperty({ example: '13:00:00' })
    endTime: string;

    @ApiProperty({ example: 'pending' })
    status: string;

    @ApiProperty({ example: 31.25, description: 'reservation price in dollars' })
    price: number;

    @ApiProperty({ type: FacilityPreviewDto, required: false })
    facility?: FacilityPreviewDto;

    @ApiProperty({ type: SlotPreviewDto, required: false })
    slot?: SlotPreviewDto;
}

export class CreateReservationResultDto {
    @ApiProperty({ type: ReservationResponseDto })
    reservation: ReservationResponseDto;

    @ApiProperty({ example: 100 })
    slotCapacity: number;

    @ApiProperty({ example: 0 })
    confirmedReservationsCount: number;
}
