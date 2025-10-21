import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { User } from '../../users/entities/users.entity';
import { IsUnique } from '../../../shared/validators/decorators/is-unique.decorator';
import { Phone } from '../../phones/phones.entity';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateProfileDTO {
    @ApiPropertyOptional({
        description: 'Email address',
        maxLength: 255,
        example: 'user@example.com',
    })
    @IsOptional()
    @IsEmail(
        {},
        {
            message: i18nValidationMessage('users.invalidEmail'),
        },
    )
    @MaxLength(255, {
        message: i18nValidationMessage('users.emailMaxLength'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('users.emailRequired'),
    })
    @IsUnique(User, 'email', {
        message: i18nValidationMessage('users.emailAlreadyInUse'),
    })
    email?: string;

    @ApiPropertyOptional({
        description: 'Phone number',
        example: '+1234567890',
    })
    @IsOptional()
    @IsPhoneNumber(undefined, {
        message: i18nValidationMessage('users.invalidPhoneNumber'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('users.phoneNumberRequired'),
    })
    @IsUnique(Phone, 'phoneNumber', {
        message: i18nValidationMessage('users.phoneAlreadyInUse'),
    })
    phoneNumber?: string;

    @ApiPropertyOptional({
        description: 'Profile picture URL',
        example: 'https://example.com/avatar.jpg',
    })
    @IsOptional()
    @IsString()
    profilePicture?: string;

    @ApiPropertyOptional({
        description: 'First name',
        minLength: 2,
        maxLength: 255,
        example: 'John',
    })
    @IsOptional()
    @IsString()
    @MinLength(2, {
        message: i18nValidationMessage('users.firstNameMinLength'),
    })
    @MaxLength(255, {
        message: i18nValidationMessage('users.firstNameMaxLength'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('users.firstNameRequired'),
    })
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Last name',
        minLength: 2,
        maxLength: 50,
        example: 'Doe',
    })
    @IsOptional()
    @IsString()
    @MinLength(2, {
        message: i18nValidationMessage('users.lastNameMinLength'),
    })
    @MaxLength(50, {
        message: i18nValidationMessage('users.lastNameMaxLength'),
    })
    @IsNotEmpty({
        message: i18nValidationMessage('users.lastNameRequired'),
    })
    lastName?: string;

    @ApiPropertyOptional({
        description: 'Latitude for location',
        type: Number,
        example: 40.7128,
    })
    @IsOptional()
    @IsLatitude({
        message: i18nValidationMessage('users.invalidLatitude'),
    })
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Longitude for location',
        type: Number,
        example: -74.006,
    })
    @IsOptional()
    @IsLongitude({
        message: i18nValidationMessage('users.invalidLongitude'),
    })
    longitude?: number;

    @ApiPropertyOptional({
        description: 'Location description or address',
        example: 'New York, NY',
    })
    @IsOptional()
    @IsString()
    location?: string;
}
