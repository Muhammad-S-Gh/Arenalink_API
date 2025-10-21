import { IsEnum, IsObject, IsOptional, IsString, ValidateNested, ValidateIf, IsArray, IsNumber } from 'class-validator';
import { AttributeType } from '../enums/attributeType.enum';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class NameTranslation {
    @ApiProperty({ example: 'Color' })
    @IsString()
    en: string;

    @ApiProperty({ example: 'لون' })
    @IsString()
    ar: string;
}

class OptionDto {
    @ApiProperty({ type: NameTranslation })
    @IsObject()
    @ValidateNested()
    @Type(() => NameTranslation)
    name: NameTranslation;
}

export class CreateAttributeDto {
    @ApiProperty({ type: NameTranslation })
    @IsObject()
    @ValidateNested()
    @Type(() => NameTranslation)
    name: NameTranslation;

    @ApiProperty({ enum: AttributeType })
    @IsEnum(AttributeType)
    type: AttributeType;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    isRequired?: boolean = false;

    @ApiProperty({ required: false })
    @ValidateIf((attr) => attr.type === AttributeType.NUMBER)
    @IsNumber()
    minLimit?: number;

    @ApiProperty({ required: false })
    @ValidateIf((attr) => attr.type === AttributeType.NUMBER)
    @IsNumber()
    maxLimit?: number;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    withFilters?: boolean = false;

    @ApiProperty({ type: [OptionDto], required: false })
    @ValidateIf((attr) => attr.type === AttributeType.ENUM)
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OptionDto)
    options?: OptionDto[];
}
