import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    IsEnum,
    IsOptional,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsPhoneNumber,
} from 'class-validator';
import { UserRole } from '../../../shared/enums/user-roles.enum';
import { IsUnique } from '../../../shared/validators/decorators/is-unique.decorator';
import { Match } from '../../../shared/validators/decorators/match.decorator';
import { User } from '../../users/entities/users.entity';
import { Phone } from '../../phones/phones.entity';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterRequestDto {
    @ApiProperty({ description: 'First name', minLength: 2, maxLength: 255, example: 'Muhammad' })
    @IsString({ message: i18nValidationMessage('auth.invalidFirstName') })
    @MinLength(2, { message: i18nValidationMessage('auth.firstNameMinLength') })
    @MaxLength(255, { message: i18nValidationMessage('auth.firstNameMaxLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.firstNameRequired') })
    firstName: string;

    @ApiProperty({ description: 'Last name', minLength: 2, maxLength: 50, example: 'Ghunaim' })
    @IsString({ message: i18nValidationMessage('auth.invalidLastName') })
    @MinLength(2, { message: i18nValidationMessage('auth.lastNameMinLength') })
    @MaxLength(50, { message: i18nValidationMessage('auth.lastNameMaxLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.lastNameRequired') })
    lastName: string;

    @ApiProperty({ description: 'Email', maxLength: 255, example: 'user@example.com' })
    @IsEmail({}, { message: i18nValidationMessage('auth.invalidEmail') })
    @MaxLength(255, { message: i18nValidationMessage('auth.emailMaxLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.emailRequired') })
    @IsUnique(User, 'email', { message: i18nValidationMessage('auth.emailAlreadyInUse') })
    email: string;

    @ApiProperty({ description: 'Password', minLength: 8, example: 'strongPass123' })
    @IsString({ message: i18nValidationMessage('auth.invalidPasswordFormat') })
    @MinLength(8, { message: i18nValidationMessage('auth.passwordMinLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.passwordRequired') })
    password: string;

    @ApiProperty({ description: 'Repeat password', minLength: 8, example: 'strongPass123' })
    @IsString({ message: i18nValidationMessage('auth.invalidPasswordFormat') })
    @MinLength(8, { message: i18nValidationMessage('auth.passwordMinLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.passwordRequired') })
    @Match('password', { message: i18nValidationMessage('auth.passwordsDoNotMatch') })
    passwordConfirmation: string;

    @ApiProperty({ description: 'Phone number', example: '+15551234567' })
    @IsPhoneNumber(undefined, { message: i18nValidationMessage('auth.invalidPhoneNumber') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.phoneNumberRequired') })
    @IsUnique(Phone, 'phoneNumber', { message: i18nValidationMessage('auth.phoneAlreadyInUse') })
    phoneNumber: string;

    @ApiPropertyOptional({ description: 'User role', enum: UserRole, example: UserRole.USER })
    @IsEnum(UserRole, { message: i18nValidationMessage('auth.roleInvalid') })
    @IsOptional()
    role?: UserRole = UserRole.USER;

    @ApiPropertyOptional({ description: 'Latitude', type: Number, example: 40.7128 })
    @IsLatitude({ message: i18nValidationMessage('auth.invalidLatitude') })
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude', type: Number, example: -74.006 })
    @IsLongitude({ message: i18nValidationMessage('auth.invalidLongitude') })
    @IsOptional()
    longitude?: number;

    @ApiPropertyOptional({ description: 'Location', example: 'Syria, Damascus, Midan' })
    @IsString({ message: i18nValidationMessage('auth.locationInvalid') })
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ description: 'Profile picture' })
    @IsString({ message: i18nValidationMessage('auth.profilePictureInvalid') })
    @IsOptional()
    profilePicture?: string;
}
