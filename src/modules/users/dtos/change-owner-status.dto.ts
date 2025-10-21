import { ApiProperty } from '@nestjs/swagger';
import { OwnerStatus } from '../../../shared/enums/owner-statuses.enum';
import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ChangeOwnerStatusDto {
    @ApiProperty({
        description: 'New owner status (approved or rejected)',
        enum: OwnerStatus,
        enumName: 'OwnerStatus',
        example: OwnerStatus.APPROVED,
        required: true,
    })
    @IsEnum(OwnerStatus, {
        message: i18nValidationMessage('users.invalidStatus'),
    })
    status: OwnerStatus;
}
