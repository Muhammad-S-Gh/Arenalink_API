import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../shared/validators/decorators/match.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ChangePasswordDTO {
    @ApiProperty({
        description: 'Current password',
        minLength: 8,
        example: 'currentPassword123',
        required: true,
    })
    @IsString({
        message: i18nValidationMessage('users.currentPasswordRequired'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('users.currentPasswordRequired'),
    })
    currentPassword: string;

    @ApiProperty({
        description: 'New password',
        minLength: 8,
        example: 'newStrongPassword!',
        required: true,
    })
    @IsString({
        message: i18nValidationMessage('users.newPasswordRequired'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('users.newPasswordRequired'),
    })
    newPassword: string;

    @ApiProperty({
        description: 'Repeat new password',
        minLength: 8,
        example: 'newStrongPassword!',
        required: true,
    })
    @IsString({
        message: i18nValidationMessage('users.passwordConfirmationRequired'),
    })
    @MinLength(8, {
        message: i18nValidationMessage('users.passwordMinLength'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('users.passwordConfirmationRequired'),
    })
    @Match('newPassword', {
        message: i18nValidationMessage('users.passwordsDoNotMatch'),
    })
    passwordConfirmation: string;
}
