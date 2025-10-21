import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TranslationDto {
    @ApiProperty({ example: 'Englesh' })
    @IsNotEmpty()
    @IsString()
    en: string;

    @ApiProperty({ example: 'عربي' })
    @IsNotEmpty()
    @IsString()
    ar: string;
}
