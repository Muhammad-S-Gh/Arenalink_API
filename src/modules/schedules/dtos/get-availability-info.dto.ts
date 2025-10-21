import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../../reservations/enums/reservation-status.enum';

export class ReservationDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    date: string;

    @ApiProperty()
    dayOfWeek: string;

    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime: string;

    @ApiProperty({ enum: ReservationStatus })
    status: ReservationStatus;

    @ApiProperty()
    price: number;
}

export class SlotsDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime: string;

    @ApiProperty()
    slotPrice: number;

    @ApiProperty({ type: [ReservationDto] })
    reservations: ReservationDto[];

    @ApiProperty()
    slotCapacity: number;

    @ApiProperty()
    confirmedReservationsCount: number;
}

export class AvailabilityDetailDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    facilityId: number;

    @ApiProperty()
    dayOfWeek: string;

    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime: string;

    @ApiProperty()
    isAvailable: boolean;

    @ApiProperty()
    slotInterval: any;

    @ApiProperty({ type: [SlotsDto] })
    slots: SlotsDto[];
}
