import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFiles,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CreateAvailabilityDTO } from './dtos/create-availability.dto';
import { ValidOwnerGuard } from '../../shared/guards/valid-owner.guard';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger/dist';
import { AvailabilityResponseDTO } from './dtos/create-availability-response.dto';
import { HolidayDto } from './dtos/holiday.dto';
import { SpecificHolidayDto } from './dtos/specific-holiday.dto';
import { Getfacilities } from '../facilities/services/getfacilities.service';
import { uploadInterceptor } from '../../shared/interceptors/upload.interceptor';
import { CreateFacilityDto } from '../facilities/dtos/create-facility.dto';
import { CreateFacilities } from '../facilities/services/createfacilities.service';
import { DeleteFileOnErrorFilter } from '../../shared/filter/delete-file-on-error.filter';
import { User } from '../auth/decorators/user.decorator';
import { Facility } from '../facilities/entities/facility.entity';
import { User as USER } from '../users/entities/users.entity';
import { Updatefacilities } from '../facilities/services/update-facilities.service';
import { UpdateFacilityDto } from '../facilities/dtos/update-facility.dto';
import { DeleteFacility } from '../facilities/services/delete-facilities.service';
import { SpecificHolidayResponseDto } from './dtos/specific-holiday-response.dto';
import { BlockSlotDto } from './dtos/block-slot.dto';
import { Reservation } from '../reservations/entities/reservation.entity';
import { BlockSlotResponseDto } from './dtos/block-slot-response.dto';
import { SlotPriceDto } from './dtos/slot-price.dto';
import { SlotPriceResponseDto } from './dtos/slot-price-response.dto';
import { GetApprovedReservationsResponseDto } from './dtos/owner-approved-reservations.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { FacilityScheduleDto, FacilityScheduleResponseDto } from './dtos/schedule-response.dto';
import { AvailabilityDetailDto } from './dtos/get-availability-info.dto';
import { IsVerifiedGuard } from '../../shared/guards/is-verified.guard';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OwnerReservationStatuses } from './enums/owner-reservation-status.enum';
import { OwnerReservationStatus } from './dtos/owner-reservation-status.dto';
import { PaymentService } from '../payment/payment.service';

@Controller('owner')
export class OwnerController {
    constructor(
        private readonly schedulesService: SchedulesService,
        private readonly getfacilities: Getfacilities,
        private readonly createFacility: CreateFacilities,
        private readonly updateFacilitiesService: Updatefacilities,
        private readonly deleteFacilityService: DeleteFacility,
        private readonly reservationService: ReservationsService,
        private readonly i18n: YcI18nService,
        private readonly notificationService: NotificationsService,
        private readonly paymentService: PaymentService,

        //
    ) {}

    //

    @Post('facilities/:id/schedule')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create availability schedule for a facility' })
    @ApiParam({
        name: 'id',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiBody({ type: CreateAvailabilityDTO })
    @ApiResponse({
        status: 201,
        description: 'Schedule created successfully',
        type: AvailabilityResponseDTO,
    })
    @HttpCode(201)
    async createAvailability(@Param('id', ParseIntPipe) facilityId: number, @Body() dto: CreateAvailabilityDTO) {
        return this.schedulesService.createAvailability(facilityId, dto);
    }

    //

    @Post('facilities/:id/holiday')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create fixed holiday per week for a facility' })
    @ApiParam({
        name: 'id',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiBody({ type: HolidayDto })
    @ApiResponse({
        status: 201,
        description: 'holiday created successfully',
        type: HolidayDto,
    })
    @HttpCode(201)
    async createHoliday(@Param('id', ParseIntPipe) facilityId: number, @Body() dto: HolidayDto) {
        return this.schedulesService.createHoliday(facilityId, dto);
    }

    @Post('facilities/:id/holiday/specific')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create specific date holiday for a facility' })
    @ApiParam({
        name: 'id',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiBody({ type: SpecificHolidayDto })
    @ApiResponse({
        status: 201,
        description: 'specifc date holiday created successfully',
        type: SpecificHolidayResponseDto,
    })
    @HttpCode(201)
    async createSpecificHoliday(@Param('id', ParseIntPipe) facilityId: number, @Body() dto: SpecificHolidayDto) {
        return this.schedulesService.createSpecificHoliday(facilityId, dto);
    }

    // ******************************************************

    @Delete('facilities/:facilityId/availability/:availabilityId')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete availability' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'availabilityId',
        type: Number,
        description: 'avaiability ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'availability deleted successfully',
    })
    @HttpCode(200)
    async deleteAvaiability(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
    ) {
        return this.schedulesService.deleteAvailability(facilityId, availabilityId);
    }

    @Patch('facilities/:facilityId/availability/:availabilityId/:slotId')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'mark slot as blocked' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'availabilityId',
        type: Number,
        description: 'avaiability ID',
        example: 10,
    })
    @ApiParam({
        name: 'slotId',
        type: Number,
        description: 'slot ID',
        example: 10,
    })
    @ApiBody({ type: BlockSlotDto })
    @ApiResponse({
        status: 200,
        description: 'slot marked as blocked successfully',
        type: BlockSlotResponseDto,
    })
    @HttpCode(200)
    async markSlotAsBlocked(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
        @Param('slotId', ParseIntPipe) slotId: number,
        @User() user,
        @Body() dto: BlockSlotDto,
    ) {
        return this.schedulesService.markSpecificSlotAsBooked(facilityId, availabilityId, slotId, user, dto);
    }

    @Delete('facilities/:facilityId/:blockedId')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'unblock blocked slot' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'blockedId',
        type: Number,
        description: 'Blocked ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'slot unblocked successfully',
    })
    @HttpCode(200)
    async unblockSlot(@Param('blockedId', ParseIntPipe) blockedId: number, @User() user) {
        return this.reservationService.unblockSlot(blockedId, user);
    }

    @Patch('facilities/:facilityId/availability/:availabilityId/:slotId/price')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'change slot price' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'availabilityId',
        type: Number,
        description: 'avaiability ID',
        example: 10,
    })
    @ApiParam({
        name: 'slotId',
        type: Number,
        description: 'slot ID',
        example: 10,
    })
    @ApiBody({ type: SlotPriceDto })
    @ApiResponse({
        status: 200,
        description: 'slot marked as blocked successfully',
        type: SlotPriceResponseDto,
    })
    @HttpCode(200)
    async changeSlotPrice(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
        @Param('slotId', ParseIntPipe) slotId: number,
        @User() user,
        @Body() dto: SlotPriceDto,
    ) {
        return this.schedulesService.changeSlotPrice(facilityId, availabilityId, slotId, user, dto);
    }

    @Get('facilities/:facilityId/reservations')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all confirmed reservations' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'List of approved (confirmed) reservations',
        type: GetApprovedReservationsResponseDto,
    })
    @HttpCode(200)
    async getApprovedReservations(@Param('facilityId', ParseIntPipe) facilityId: number) {
        return this.reservationService.getOwnerReservations(facilityId);
    }

    @Get('facilities/:facilityId/reservations/pending')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all pending reservations' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'List of pending reservations',
        type: GetApprovedReservationsResponseDto,
    })
    @HttpCode(200)
    async getPendingReservations(@Param('facilityId', ParseIntPipe) facilityId: number) {
        return this.reservationService.getPendingReservations(facilityId);
    }

    @Patch('facilities/:facilityId/reservations/:reservationId')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change pending reservations to Ready' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'reservationId',
        type: Number,
        description: 'Reservation ID',
        example: 10,
    })
    @ApiBody({
        type: OwnerReservationStatus,
        description: 'change pending reservation to ready or rejected',
    })
    @ApiResponse({
        status: 200,
        description: 'change pending reservation successful',
    })
    @HttpCode(200)
    async changePendingReservation(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('reservationId', ParseIntPipe) reservationId: number,
        @Body() dto: OwnerReservationStatus,
        @User() user,
    ) {
        return this.schedulesService.OwnerchangesReservationStatus(facilityId, user, reservationId, dto.status);
    }

    // ************************

    @Get('facilities/:facilityId/schedule')
    @ApiParam({ name: 'facilityId', type: Number })
    @ApiResponse({ status: 200, description: 'Facility schedule', type: FacilityScheduleResponseDto })
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, IsVerifiedGuard)
    @ApiOperation({ summary: 'Get facility schedule' })
    async getFacilitySchedule(
        @Param('facilityId', ParseIntPipe) facilityId: number,
    ): Promise<FacilityScheduleResponseDto> {
        const scheduleResult = await this.schedulesService.getSchedule(facilityId);
        const blocked = await this.reservationService.getBlockedSlots(facilityId);
        const schedule = Array.isArray(scheduleResult) ? scheduleResult : [scheduleResult];

        return { schedule, blocked };
    }

    @Get('facilities/:facilityId/schedule/:availabilityId')
    @ApiParam({ name: 'facilityId', type: Number })
    @ApiParam({ name: 'availabilityId', type: Number })
    @ApiResponse({ status: 200, description: 'Facility schedule', type: AvailabilityDetailDto })
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, IsVerifiedGuard)
    @ApiOperation({ summary: 'Get facility schedule' })
    async getAvailabilitySlots(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('availabilityId', ParseIntPipe) availabilityId: number,
    ): Promise<AvailabilityDetailDto> {
        return this.schedulesService.getSlots(facilityId, availabilityId);
    }

    //

    //

    //

    @Delete('facilities/:facilityId/holiday/:holidayId')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete recurring holiday' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'holidayId',
        type: Number,
        description: 'Holiday ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'Holiday deleted successfully',
    })
    @HttpCode(200)
    async deleteHoliday(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('holidayId', ParseIntPipe) holidayId: number,
        @User() user,
    ) {
        return this.schedulesService.deleteHoliday(facilityId, holidayId, user);
    }

    //

    //

    //

    @Delete('facilities/:facilityId/holiday/specific/:holidayId')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete specific holiday' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'holidayId',
        type: Number,
        description: 'Holiday ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'Holiday deleted successfully',
    })
    @HttpCode(200)
    async deleteSpecificHoliday(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('holidayId', ParseIntPipe) holidayId: number,
        @User() user,
    ) {
        return this.schedulesService.deleteSpecificHoliday(facilityId, holidayId, user);
    }

    //

    //

    //

    @Get('facilities/:facilityId/payments')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'get facility payments' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'payments returned successfully',
    })
    @HttpCode(200)
    async getFacilityPayments(@Param('facilityId', ParseIntPipe) facilityId: number, @User() user) {
        return this.paymentService.findFacilityPayments(facilityId, user);
    }

    //

    //

    //

    @Patch('facilities/:facilityId/payments/:paymentIntentId/refund')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'refund a specific payment' })
    @ApiParam({
        name: 'facilityId',
        type: Number,
        description: 'Facility ID',
        example: 10,
    })
    @ApiParam({
        name: 'paymentIntentId',
        type: Number,
        description: 'Payment intent ID',
        example: 'pi_jaie...',
    })
    @ApiResponse({
        status: 200,
        description: 'payments refunded successfully',
    })
    @HttpCode(200)
    async ownerRefund(
        @Param('facilityId', ParseIntPipe) facilityId: number,
        @Param('paymentIntentId') paymentIntentId: string,
        @User() user,
    ) {
        return this.paymentService.ownerRefundPayment(paymentIntentId, user);
    }

    //

    //

    //

    @Get('notifications')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Admin Notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
    @ApiQuery({ name: 'page', type: Number, description: 'Page number' })
    @HttpCode(200)
    async getNotifcations(@User() user, @Query('page', ParseIntPipe) page?: string) {
        const lang = this.i18n.lang();
        const pageNum = page ? Number(page) : 1;
        return this.notificationService.getNotifications(user.id, lang, pageNum);
    }

    @Patch('notifications/:notificationId')
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Notification marked as read' })
    @ApiResponse({ status: 200, description: 'Notification marked successfully' })
    @HttpCode(200)
    async markNotificationAsRead(@Param('notificationId', ParseIntPipe) notificationId, @User() user) {
        return this.notificationService.markNotificationAsRead(notificationId, user.id);
    }

    //

    //

    //
    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, IsVerifiedGuard)
    @Get('facilities/:id')
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Facility found' })
    @ApiResponse({ status: 404, description: 'Facility not found' })
    async findOneforOwner(@Param('id') id: string, @User() user) {
        return this.getfacilities.getOwnerFacility(Number(id), user);
    }

    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @Post('facilities')
    @UseFilters(DeleteFileOnErrorFilter)
    @uploadInterceptor('images', 'facilities', 10)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Create a new facility',
        type: CreateFacilityDto,
    })
    async create(@Body() dto: CreateFacilityDto, @UploadedFiles() files: Express.Multer.File[], @User() user: USER) {
        const imagePaths = files.map((f) => `uploads/facilities/${f.filename}`);
        return this.createFacility.create(dto, user, imagePaths);
    }

    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @Get('facilities')
    @ApiOperation({ summary: 'Get all facilities owned by the logged-in owner' })
    @ApiResponse({ status: 200, description: 'List of owner facilities', type: [Facility] })
    async getOwnerFacilities(@User() user) {
        return this.getfacilities.getOwnerFacilities(user.id);
    }

    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, ValidOwnerGuard, IsVerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete facility' })
    @ApiResponse({ status: 200, description: 'Facility deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden: Not the owner' })
    @ApiResponse({ status: 400, description: 'Facility has reservations' })
    @Delete('facilities/:id')
    async deleteFacility(@Param('id') id: number, @User() user) {
        return this.deleteFacilityService.deleteFacility(Number(id), user);
    }

    @Roles(UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard, IsVerifiedGuard)
    @Patch('facilities/:id')
    @UseFilters(DeleteFileOnErrorFilter)
    @uploadInterceptor('newImages', 'facilities', 10)
    @ApiOperation({ summary: 'Update facility (details, images, attributes)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateFacilityDto })
    async updateFacility(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @UploadedFiles() files: Express.Multer.File[],
        @User() user,
    ) {
        if (body.deletedImages && typeof body.deletedImages === 'string') {
            try {
                body.deletedImages = JSON.parse(body.deletedImages);
            } catch {
                throw new BadRequestException('Invalid deletedImages JSON');
            }
        }

        if (body.attributes && typeof body.attributes === 'string') {
            try {
                body.attributes = JSON.parse(body.attributes);
            } catch {
                throw new BadRequestException('Invalid attributes JSON');
            }
        }

        if (files && files.length) {
            body.newImages = files.map((f) => `/uploads/facilities/${f.filename}`);
        }

        return this.updateFacilitiesService.updateFacility(id, body as UpdateFacilityDto, user.id);
    }
}
