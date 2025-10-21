import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { Expose, Transform } from 'class-transformer';

export class FacilityPreviewDto {
    @ApiProperty({ example: 5 })
    @Expose()
    id: number;

    @ApiProperty({ example: { en: 'Al-Majed pool', ar: 'مسبح المجد' } })
    @Expose()
    name: { en: string; ar: string };
}

export class SpecificHolidayResponseDto {
    @ApiProperty({ example: 3 })
    @Expose()
    id: number;

    @ApiProperty({ type: FacilityPreviewDto })
    @Expose()
    facility: FacilityPreviewDto;

    @ApiProperty({ example: 'tuesday', enum: DayOfWeek })
    @Expose()
    dayOfWeek: DayOfWeek;

    @ApiProperty({ example: '2025-08-30' })
    @Expose()
    date: Date | null;

    @ApiProperty({ example: 'maintenance day off' })
    @Expose()
    reason?: string;
}
