// src/modules/facilities/dtos/update-facility-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { FacilityStatus } from '../enums/facility-status.enum';

export class UpdateFacilityStatusDto {
  @ApiProperty({ enum: FacilityStatus })
  @IsEnum(FacilityStatus)
  status: FacilityStatus;
}
