import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MinLength,
} from 'class-validator';
import { Match } from '../../../shared/validators/decorators/match.decorator';
import { IsUnique } from '../../../shared/validators/decorators/is-unique.decorator';
import { Phone } from '../../phones/phones.entity';
import { UserRole } from '../../../shared/enums/user-roles.enum';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CompleteProfileDTO {
    @ApiProperty({ description: 'New password', minLength: 8, example: 'strongPass123' })
    @IsString({ message: i18nValidationMessage('auth.invalidPasswordFormat') })
    @MinLength(8, { message: i18nValidationMessage('auth.passwordMinLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.passwordRequired') })
    password: string;

    @ApiProperty({ description: 'Repeat new password', minLength: 8, example: 'strongPass123' })
    @IsString({ message: i18nValidationMessage('auth.invalidPasswordFormat') })
    @MinLength(8, { message: i18nValidationMessage('auth.passwordMinLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.passwordRequired') })
    @Match('password', { message: i18nValidationMessage('auth.passwordsDoNotMatch') })
    passwordConfirmation: string;

    @ApiProperty({ description: 'Phone number for this user', example: '+15551234567' })
    @IsPhoneNumber(undefined, { message: i18nValidationMessage('auth.invalidPhoneNumber') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.phoneNumberRequired') })
    @IsUnique(Phone, 'phoneNumber', { message: i18nValidationMessage('auth.phoneAlreadyInUse') })
    phoneNumber: string;

    @ApiPropertyOptional({ description: 'Role to assign', enum: UserRole, example: UserRole.USER })
    @IsEnum(UserRole, { message: i18nValidationMessage('auth.roleInvalid') })
    @IsOptional()
    role?: UserRole = UserRole.USER;

    @ApiPropertyOptional({ description: 'Latitude coordinate', type: Number, example: 40.7128 })
    @IsLatitude({ message: i18nValidationMessage('auth.invalidLatitude') })
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude coordinate', type: Number, example: -74.006 })
    @IsLongitude({ message: i18nValidationMessage('auth.invalidLongitude') })
    @IsOptional()
    longitude?: number;

    @ApiPropertyOptional({ description: 'Human-readable location', example: 'New York, NY' })
    @IsString({ message: i18nValidationMessage('auth.locationInvalid') })
    @IsOptional()
    location?: string;
}
