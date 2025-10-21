import { IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TranslationDto {
    @ApiProperty({ example: 'Color' })
    @IsOptional()
    @IsString()
    en?: string;

    @ApiProperty({ example: 'لون' })
    @IsOptional()
    @IsString()
    ar?: string;
}

export class UpdateCategoryDto {
    @ApiProperty({ type: TranslationDto, required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => TranslationDto)
    name?: {
        en: string;
        ar: string;
    };

    @ApiProperty({ example: 'fa-solid fa-box', required: false })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiProperty({ type: TranslationDto, required: false })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => TranslationDto)
    description?: {
        en: string;
        ar: string;
    };
}
