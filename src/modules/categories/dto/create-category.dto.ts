// create-simple-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
    IsArray,
    IsEnum,
    IsBoolean,
    IsNumber,
    ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttributeType } from '../enums/attributeType.enum';
import { TranslationDto } from './translation.dto'; // reuse the TranslationDto

export class CreateCategoryDto {
    @ApiProperty({ type: TranslationDto })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => TranslationDto)
    name: TranslationDto;

    @ApiProperty({ example: 'fa-solid fa-box' })
    @IsNotEmpty()
    @IsString()
    icon: string;

    @ApiProperty({ type: TranslationDto, required: false })
    @IsOptional()
    @ValidateNested()
    @Type(() => TranslationDto)
    description?: TranslationDto;
}

class AttributeOptionDto {
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => TranslationDto)
    name: TranslationDto;
}

class CategoryAttributeDto {
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => TranslationDto)
    name: TranslationDto;

    @IsNotEmpty()
    @IsEnum(AttributeType)
    type: AttributeType;

    @ValidateIf((attr) => attr.type === AttributeType.ENUM)
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttributeOptionDto) // converts plain JSON objects to actual AttributeOptionDto needed for ValidationNested
    options?: AttributeOptionDto[];

    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;

    @ValidateIf((attr) => attr.type === AttributeType.NUMBER)
    @IsOptional()
    @IsNumber()
    minLimit?: number;

    @ValidateIf((attr) => attr.type === AttributeType.NUMBER)
    @IsOptional()
    @IsNumber()
    maxLimit?: number;

    @IsOptional()
    @IsBoolean()
    withFilters?: boolean;
}
