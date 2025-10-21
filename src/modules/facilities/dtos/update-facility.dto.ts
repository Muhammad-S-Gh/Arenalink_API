import { IsArray, IsNumber, IsOptional, IsString, ValidateNested, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AttributeType } from '../../categories/enums/attributeType.enum';

class LocalizedString {
    @IsString()
    @IsNotEmpty()
    en: string;

    @IsString()
    @IsNotEmpty()
    ar: string;
}

export class UpdateFacilityAttributeDto {
    @IsNumber()
    @Type(() => Number)
    categoryAttributeId: number;

    @IsEnum(AttributeType)
    type: AttributeType;

    @IsOptional()
    value?: any;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    optionId?: number;
}

export class UpdateFacilityDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedString)
    name?: LocalizedString;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedString)
    description?: LocalizedString;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    lat?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    lng?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    pricePerHour?: number;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    @Transform(({ value }) => (Array.isArray(value) ? value : [])) // ensure it's always an array
    deletedImages: string[] = [];

    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [])) // ensure it's always an array
    newImages: string[] = [];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateFacilityAttributeDto)
    attributes?: UpdateFacilityAttributeDto[];
}
