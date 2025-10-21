import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../shared/enums/user-roles.enum';

export class UserProfileDto {
    @ApiProperty({
        description: 'User ID',
        example: 1,
    })
    id: number;

    @ApiProperty({
        description: 'Email address',
        example: 'user@example.com',
    })
    email: string;

    @ApiProperty({
        description: 'Phone number',
        example: '+963 999 999 999',
    })
    phoneNumber: string;

    @ApiProperty({
        description: 'First name',
        example: 'John',
    })
    firstName: string;

    @ApiProperty({
        description: 'Last name',
        example: 'Doe',
    })
    lastName: string;

    @ApiProperty({
        description: 'Profile picture URL',
        example: 'https://example.com/avatar.jpg',
        required: false,
    })
    profilePicture?: string;

    @ApiProperty({
        description: 'Latitude coordinate',
        example: 40.7128,
        required: false,
    })
    latitude?: number;

    @ApiProperty({
        description: 'Longitude coordinate',
        example: -74.006,
        required: false,
    })
    longitude?: number;

    @ApiProperty({
        description: 'User role',
        enum: UserRole,
        example: UserRole.USER,
    })
    role: UserRole;

    @ApiProperty({
        description: 'Human-readable location',
        example: 'New York, NY',
        required: false,
    })
    location?: string;

    @ApiProperty({
        description: 'Creation timestamp',
        example: '2023-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last update timestamp',
        example: '2023-01-02T00:00:00.000Z',
    })
    updatedAt: Date;
}
