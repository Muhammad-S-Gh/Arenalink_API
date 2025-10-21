// src/modules/reservations/dtos/create-reservation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, Validate } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsFutureDate } from '../../../shared/validators/decorators/is-future.decorator';

export class CreateReservationDto {
    @ApiProperty({
        description: 'Date for this reservation (YYYY-MM-DD). Required when booking a recurring/template slot.',
        required: true,
        example: '2025-08-21',
    })
    @IsISO8601({}, { message: i18nValidationMessage('reservations.invalidDateFormat') })
    @IsFutureDate({ message: i18nValidationMessage('reservations.dateMustBeFuture') })
    @IsNotEmpty({ message: i18nValidationMessage('reservations.requiredDate') })
    date: string;
}
