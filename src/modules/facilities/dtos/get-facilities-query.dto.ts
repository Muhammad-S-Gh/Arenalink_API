// dto/get-facilities-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetFacilitiesQueryDto {
  @ApiPropertyOptional({ description: 'Search text (matches name & description)', example: 'indoor' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID', example: 3 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filter by status', example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ description: 'Items per page (default: 10)', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit = 10;
}
