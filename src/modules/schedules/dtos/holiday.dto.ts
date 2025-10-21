import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class HolidayDto {
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
    @IsOptional()
    reason: string;
}
