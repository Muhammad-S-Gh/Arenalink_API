import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDTO {
    @ApiProperty({ description: 'First name', minLength: 2, maxLength: 50, example: 'Jane' })
    @IsString({ message: i18nValidationMessage('auth.invalidFirstName') })
    @MinLength(2, { message: i18nValidationMessage('auth.firstNameMinLength') })
    @MaxLength(50, { message: i18nValidationMessage('auth.firstNameMaxLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.firstNameRequired') })
    firstName: string;

    @ApiProperty({ description: 'Last name', minLength: 2, maxLength: 50, example: 'Doe' })
    @IsString({ message: i18nValidationMessage('auth.invalidLastName') })
    @MinLength(2, { message: i18nValidationMessage('auth.lastNameMinLength') })
    @MaxLength(50, { message: i18nValidationMessage('auth.lastNameMaxLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.lastNameRequired') })
    lastName: string;

    @ApiProperty({ description: 'Email address', example: 'user@example.com' })
    @IsEmail({}, { message: i18nValidationMessage('auth.invalidEmail') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.emailRequired') })
    email: string;

    @ApiPropertyOptional({ description: 'Profile picture URL', example: 'https://cdn.example.com/avatar.png' })
    @IsString({ message: i18nValidationMessage('auth.profilePictureInvalid') })
    @IsOptional()
    profilePicture?: string;

    @ApiProperty({ description: 'Password', example: 'securePass!23' })
    @IsString({ message: i18nValidationMessage('auth.invalidPasswordFormat') })
    @MinLength(8, { message: i18nValidationMessage('auth.passwordMinLength') })
    @IsNotEmpty({ message: i18nValidationMessage('auth.passwordRequired') })
    password: string;
}
