// file: schedule.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { FacilityDayOff } from '../entities/facility-days-off.entity';
import { FacilityAvailability } from '../entities/facility-availability.entity';
import { Reservation } from '../../../modules/reservations/entities/reservation.entity';

export class FacilityScheduleDto {
    @ApiProperty({ type: Number, description: 'facility id' })
    facilityId: number;

    @ApiProperty({ type: [FacilityDayOff], description: 'Recurring holidays (date null)' })
    recurringHolidays: FacilityDayOff[];

    @ApiProperty({ type: [FacilityDayOff], description: 'Date-specific holidays (date null)' })
    dateSpecificHolidays: FacilityDayOff[];

    @ApiProperty({ type: [FacilityAvailability], description: 'Available days' })
    availableDays: Partial<FacilityAvailability>[];

    @ApiProperty({ type: [Reservation], description: 'Legacy confirmed reservations with no slot/availability' })
    legacyReservations: Reservation[];
}

export class FacilityScheduleResponseDto {
    @ApiProperty({ type: Number, description: 'facility id' })
    schedule: FacilityScheduleDto[];

    @ApiProperty({ type: [Reservation], description: 'Blocked date-specific slots' })
    blocked: Reservation[];
}
