import { IsEnum, IsNotEmpty, IsString, Matches, Validate } from 'class-validator';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ApiProperty } from '@nestjs/swagger';
import { StartBeforeEnd } from '../../../shared/validators/start-before-end.validator';
import { IntervalRange } from '../../../shared/validators/interval-range.validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateAvailabilityDTO {
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
    dayOfWeek: DayOfWeek;

    @ApiProperty({ description: 'The start time in 24-format HH:MM (e.g: 10:00)' })
    @Transform(({ value }) => value.trim())
    // 01=0or1 \d=0~9 || 2[0~3]  0-5=0~5 (00~19 || 20~23)
    @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
        message: i18nValidationMessage('schedules.invalidTimeFormat'),
    })
    @IsString()
    startTime: string;

    @ApiProperty({ description: 'The end time in 24-format HH:MM (e.g: 21:00)' })
    @Transform(({ value }) => value.trim())
    @Validate(StartBeforeEnd, { message: i18nValidationMessage('schedules.startMustBeBeforeEnd') })
    @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, { message: i18nValidationMessage('schedules.invalidTimeFormat') })
    @IsString()
    endTime: string;

    @ApiProperty({ description: 'The interval in format HH:MM (e.g: 1:30) means 1 hour and 30 minutes' })
    // \d=0~9  d+=1 means one more digit so in this case we can add 12:00~59
    @Matches(/^\d+:[0-5]\d$/, { message: i18nValidationMessage('schedules.invalidIntervalFormat') })
    @Validate(IntervalRange, { message: i18nValidationMessage('schedules.invalidIntervalRange') })
    @IsString()
    slotInterval: string;
}
