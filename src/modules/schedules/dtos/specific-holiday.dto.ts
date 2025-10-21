import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { IsEnum, IsNotEmpty, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsFutureDate } from '../../../shared/validators/decorators/is-future.decorator';

export class SpecificHolidayDto {
    @ApiProperty({
        description: 'Day of the week (sunday-monday-...saturday)',
        enum: DayOfWeek,
        enumName: 'DayOfWeek',
        example: DayOfWeek.SATURDAY,
    })
    @IsEnum(DayOfWeek, {
        message: i18nValidationMessage('schedules.invalidDayOfWeek'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('schedules.requiredDayOfWeek'),
    })
    //
    dayOfWeek: DayOfWeek;

    @IsString({
        message: i18nValidationMessage('schedules.requiredReason'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('schedules.requiredReason'),
    })
    //
    reason: string;

    @ApiProperty({
        description: 'Date for the holiday (ISO 8601 string or date)',
        example: '2025-12-25',
    })
    @Type(() => Date)
    @IsDate({
        message: i18nValidationMessage('schedules.invalidDate'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('schedules.requiredDate'),
    })
    @IsFutureDate({
        message: i18nValidationMessage('schedules.dateMustBeFuture'),
    })
    //
    date: Date;
}
