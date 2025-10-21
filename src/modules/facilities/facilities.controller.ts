// facilities.controller.ts
import {
    Body,
    Headers,
    Controller,
    Get,
    Param,
    Post,
    Patch,
    UploadedFile,
    UseFilters,
    UseGuards,
    Query,
    ParseIntPipe,
    UploadedFiles,
    UseInterceptors,
    BadRequestException,
    Delete,
    Req,
    Inject,
    forwardRef,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiConsumes,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateFacilityDto } from './dtos/create-facility.dto';
import { CreateFacilities } from './services/createfacilities.service';
import { Updatefacilities } from './services/update-facilities.service';
import { Facility } from './entities/facility.entity';
import { Getfacilities } from './services/getfacilities.service';
import { User } from '../auth/decorators/user.decorator';
import { uploadInterceptor } from '../../shared/interceptors/upload.interceptor';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { UpdateFacilityStatusDto } from './dtos/update-facility-status.dto';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UpdateFacilityDto } from './dtos/update-facility.dto';
import { DeleteFileOnErrorFilter } from '../../shared/filter/delete-file-on-error.filter';
import { DeleteFacility } from './services/delete-facilities.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { SchedulesService } from '../schedules/schedules.service';
import { FacilityScheduleDto } from '../schedules/dtos/schedule-response.dto';
import { AvailabilityDetailDto } from '../schedules/dtos/get-availability-info.dto';
import { User as USER } from '../users/entities/users.entity';

@ApiTags('Facilities')
@Controller('facilities')
export class FacilitiesController {
    constructor(
        private readonly createFacility: CreateFacilities,
        private readonly updateFacilitiesService: Updatefacilities,
        private readonly facilitiesService: CreateFacilities,
        private readonly getfacilities: Getfacilities,
        private readonly deleteFacilityService: DeleteFacility,
        // @Inject(forwardRef(() => SchedulesService))
        private readonly scheduleService: SchedulesService,
    ) {}
    // create facility
    // @Roles(UserRole.OWNER)
    // @Post()
    // @ApiOperation({ summary: 'Create a new facility' })
    // @ApiResponse({ status: 201, description: 'Facility created successfully', type: Facility })
    // @ApiResponse({ status: 404, description: 'Owner or Category not found' })
    // @ApiBody({ type: CreateFacilityDto })
    // async create(@Body() createFacilityDto: CreateFacilityDto, @User() user) {
    //     return this.facilitiesService.create(createFacilityDto, user);
    // }

    // getfacility by id
    @Get(':id')
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Facility found' })
    @ApiResponse({ status: 404, description: 'Facility not found' })
    async findOne(@Param('id') id: string, @User() user: USER) {
        return this.getfacilities.getFacility(Number(id), user);
    }

    @Roles(UserRole.ADMIN)
    @Patch(':id/status')
    @ApiParam({ name: 'id', type: String })
    async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFacilityStatusDto, @User() user) {
        return this.updateFacilitiesService.updateStatus(id, dto, user);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all facilities',
        description: 'Returns a paginated list of facilities with optional search, category, and attribute filtering.',
    })
    @ApiResponse({ status: 200, description: 'List of facilities returned successfully.' })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Search keyword for facility name/description (both EN/AR)',
    })
    @ApiQuery({
        name: 'categoryId',
        required: false,
        type: Number,
        description: 'Filter facilities by category ID',
        example: 3,
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        example: 1,
        description: 'Page number (default 1)',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        example: 10,
        description: 'Number of items per page (default 10)',
    })
    @ApiQuery({
        name: 'attr[<attributeId>]',
        required: false,
        type: String,
        description: `Filter by category attribute ID.
      - For boolean: true/false
      - For number: number value
      - For enum: option ID
      Example: attr[1]=true&attr[2]=5`,
        style: 'deepObject',
    })
    async getFacilities(@Query() query: any, @User() user) {
        return this.getfacilities.getAllFacilities(query, user);
    }

    @Get(':facilityId/schedule')
    @ApiParam({ name: 'facilityId', type: Number })
    @ApiResponse({ status: 200, description: 'Facility schedule', type: FacilityScheduleDto })
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Get facility schedule' })
    async getFacilitySchedule(@Param('facilityId', ParseIntPipe) facilityId: number): Promise<FacilityScheduleDto> {
        return this.scheduleService.getSchedule(facilityId);
    }

    @Get(':facilityId/schedule/:availabilityId')
    @ApiParam({ name: 'facilityId', type: Number })
    @ApiParam({ name: 'availabilityId', type: Number })
    @ApiResponse({ status: 200, description: 'Facility schedule', type: AvailabilityDetailDto })
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Get facility schedule' })
    async getAvailabilitySlots(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
    ): Promise<AvailabilityDetailDto> {
        return this.scheduleService.getSlots(facilityId, availabilityId);
    }
}
