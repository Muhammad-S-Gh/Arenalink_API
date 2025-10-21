import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Platform } from '../../../shared/enums/platform.enum';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FcmDTO {
    @ApiProperty({ description: 'FCM token', example: 'dGhpcy1pc19hLXJlYWwtZnR1bWNhbXB1bGF0b3I=' })
    @IsString({ message: i18nValidationMessage('auth.invalidFcmToken') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.fcmTokenRequired') })
    fcm_token: string;

    @ApiProperty({ description: 'Device platform', enum: Platform, example: Platform.ANDROID })
    @IsString({ message: i18nValidationMessage('auth.isString') })
    @IsEnum(Platform, { message: i18nValidationMessage('auth.invalidPlatformType') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.platformRequired') })
    platform: Platform;
}
