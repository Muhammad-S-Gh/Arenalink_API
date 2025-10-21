import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../shared/validators/decorators/match.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResetPasswordDTO {
    @ApiProperty({ description: 'Email for reset', example: 'user@example.com' })
    @IsEmail({}, { message: i18nValidationMessage('auth.invalidEmail') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.emailRequired') })
    email: string;

    @ApiProperty({ description: 'New password', minLength: 8, example: 'newStrongPass123' })
    @IsString({ message: i18nValidationMessage('auth.invalidPasswordFormat') })
    @MinLength(8, { message: i18nValidationMessage('auth.passwordMinLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.passwordRequired') })
    password: string;

    @ApiProperty({ description: 'Repeat password', minLength: 8, example: 'newStrongPass123' })
    @IsString({ message: i18nValidationMessage('auth.invalidPasswordFormat') })
    @MinLength(8, { message: i18nValidationMessage('auth.passwordMinLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.passwordRequired') })
    @Match('password', { message: i18nValidationMessage('auth.passwordsDoNotMatch') })
    passwordConfirmation: string;
}
