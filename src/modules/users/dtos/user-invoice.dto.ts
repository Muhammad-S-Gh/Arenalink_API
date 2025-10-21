import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../../schedules/enums/day-of-week.enum';

class FacilityPreviewDto {
    @ApiProperty({ example: 5 })
    id: number;
    @ApiProperty({ example: { en: 'Al-Majed pool', ar: 'مسبح المجد' } })
    name: string;
}

class PaymentInfoDto {
    @ApiProperty({ example: 123, nullable: true })
    paymentId: number | null;

    @ApiProperty({ example: '2025-08-23T12:00:00Z' })
    paymentDate: string | null;

    @ApiProperty({ example: 'PAID' })
    paymentStatus: string;

    @ApiProperty({ example: 'Reservation Fee' })
    title: string | null;

    @ApiProperty({ example: 'Fee for booking on 2025-08-25' })
    description: string | null;

    @ApiProperty({ example: 'Fee for booking on 2025-08-25' })
    paymentIntentId: string | null;
}

export class UserInvoiceDto {
    @ApiProperty({ example: 9 })
    id: number;
    @ApiProperty({ example: '2025-08-25' })
    date: string;
    @ApiProperty({ example: 'monday', enum: DayOfWeek })
    dayOfWeek: DayOfWeek;
    @ApiProperty({ example: '11:45:00' })
    startTime: string;
    @ApiProperty({ example: '13:00:00' })
    endTime: string;
    @ApiProperty({ example: 'confirmed' })
    status: string;
    @ApiProperty({ example: 31.25, description: 'reservation price in dollars' })
    price: number;
    @ApiProperty({ type: FacilityPreviewDto })
    facility: FacilityPreviewDto;
    @ApiProperty({ type: PaymentInfoDto })
    payment: PaymentInfoDto;
}

export class GetMyInvoicesResponseDto {
    @ApiProperty({ type: [UserInvoiceDto] }) invoices: UserInvoiceDto[];
}
