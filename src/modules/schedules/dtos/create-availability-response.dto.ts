import { ApiProperty } from '@nestjs/swagger/dist';

export class SlotDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    dayOfWeek: string;

    @ApiProperty()
    slotPrice: string;

    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime: string;

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: string;
}

export class AvailabilityResponseDataDTO {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: [SlotDTO] })
    slots: SlotDTO[];

    @ApiProperty()
    dayOfWeek: string;

    @ApiProperty()
    startTime: string;

    @ApiProperty()
    endTime: string;

    @ApiProperty({
        description: 'Slot interval structure',
        type: 'object',
        properties: { hours: { type: 'number' }, minutes: { type: 'number' } },
    })
    slotInterval: { hours: number; minutes: number };

    @ApiProperty()
    isAvailable: boolean;

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: string;
}

export class AvailabilityResponseDTO {
    @ApiProperty({ enum: ['success'] })
    status: 'success';

    @ApiProperty({ example: 'success' })
    message: string;

    @ApiProperty({ type: AvailabilityResponseDataDTO })
    data: AvailabilityResponseDataDTO;
}
