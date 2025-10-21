import {
    IsArray,
    IsEnum,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FacilityStatus } from '../enums/facility-status.enum';

export class AttributeValueDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    @Type(() => Number)
    categoryAttributeId: number;

    @ApiProperty({
        description: 'Option ID for ENUM attributes (optional, required only for enum type)',
        example: 5,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    optionId?: number;

    @ApiProperty({
        description: 'The actual value (string, boolean, number, or object depending on attribute type)',
        example: 'Some text',
        required: false,
    })
    @IsOptional()
    value?: number | boolean | { en: string; ar: string };
}

export class CreateFacilityDto {
    @ApiProperty({ example: 2 })
    @Type(() => Number)
    @IsNumber()
    categoryId: number;

    @ApiProperty({
        example: { en: 'almajd court', ar: 'ملعب المجد' },
        type: Object,
    })
    @IsObject()
    @IsNotEmpty()
    name: { en: string; ar: string };

    @ApiProperty({
        example: { en: 'Spacious indoor hall', ar: 'قاعة داخلية فسيحة' },
        type: Object,
    })
    @IsObject()
    @IsNotEmpty()
    description: { en: string; ar: string };

    @ApiProperty({ example: 24.774265 })
    @IsLatitude()
    lat: number;

    @ApiProperty({ example: 46.738586 })
    @IsLongitude()
    lng: number;

    @ApiProperty({ example: 150.0 })
    @Type(() => Number)
    @IsNumber()
    pricePerHour: number;

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Array of facility images',
    })
    @IsArray()
    @IsOptional()
    @Transform(({ value }) => (Array.isArray(value) ? value : []))
    images?: string[];

    @ApiProperty({ enum: FacilityStatus, default: FacilityStatus.INACTIVE })
    @IsEnum(FacilityStatus)
    @IsOptional()
    status: FacilityStatus = FacilityStatus.INACTIVE;

    @ApiProperty({
        type: [AttributeValueDto],
        description: 'List of attribute values with reference to categoryAttributeId',
    })
    @IsArray()
    @ArrayMinSize(0)
    @ValidateNested({ each: true })
    @Type(() => AttributeValueDto)
    attributes: AttributeValueDto[];
}
