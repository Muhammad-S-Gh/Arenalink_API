import { ApiProperty } from '@nestjs/swagger/dist';
import { OwnerReservationStatuses } from '../enums/owner-reservation-status.enum';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class OwnerReservationStatus {
    @ApiProperty({ enum: OwnerReservationStatuses })
    @IsEnum(OwnerReservationStatuses, { message: 'status can only be ready or rejected' })
    @IsNotEmpty({ message: 'status is required' })
    status: OwnerReservationStatuses;
}
