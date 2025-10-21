import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmEmailDto {
    @ApiProperty({
        description: 'Email verification token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}

export default ConfirmEmailDto;
