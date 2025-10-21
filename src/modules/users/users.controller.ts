import {
    Body,
    Controller,
    Delete,
    forwardRef,
    Get,
    HttpCode,
    Inject,
    Param,
    ParseFilePipe,
    ParseIntPipe,
    Patch,
    Put,
    Query,
    UploadedFile,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ChangePasswordDTO } from './dtos/change-password.dto';
import { User } from '../auth/decorators/user.decorator';
import { UsersService } from './users.service';
import { DeleteFileOnErrorFilter } from '../../shared/filter/delete-file-on-error.filter';
import { uploadInterceptor } from '../../shared/interceptors/upload.interceptor';
import { UpdateProfileDTO } from './dtos/update-profile.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiExtraModels,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ReservationsService } from '../reservations/reservations.service';
import { ReservationResponseDto } from '../reservations/dtos/reservation-response.dto';
import { GetMyInvoicesResponseDto } from './dtos/user-invoice.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { string } from 'joi/lib';
import { PaymentService } from '../payment/payment.service';

@ApiExtraModels(UpdateProfileDTO)
@Controller('profile')
@ApiBearerAuth()
export class UsersController {
    constructor(
        private usersService: UsersService,
        private reservationsService: ReservationsService,
        private i18n: YcI18nService,
        private notificationService: NotificationsService,
        @Inject(forwardRef(() => PaymentService))
        private paymentService: PaymentService,
    ) {}

    @Put('change-password')
    @Roles(UserRole.USER, UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Change current user password' })
    @ApiBody({ type: ChangePasswordDTO })
    @ApiResponse({ status: 200, description: 'Password updated successfully' })
    @HttpCode(200)
    async changePassword(@Body() dto: ChangePasswordDTO, @User() user) {
        await this.usersService.changePassword(user, dto);
        return { message: this.i18n.t('users.success.password_updated') };
    }

    @Patch('update')
    @Roles(UserRole.USER, UserRole.OWNER)
    @UseGuards(JwtGuard, RolesGuard)
    @UseFilters(DeleteFileOnErrorFilter)
    @uploadInterceptor('profilePicture', 'profile_pictures')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateProfileDTO })
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @HttpCode(200)
    updateProfile(
        @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file: Express.Multer.File,
        @Body() dto: UpdateProfileDTO,
        @User() user,
    ) {
        return this.usersService.updateProfile(file, user, dto);
    }

    @Get('')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved' })
    @HttpCode(200)
    getUserProfile(@User() user) {
        return this.usersService.getProfile(user);
    }

    @Delete('delete')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Delete current user account' })
    @ApiBody({ schema: { type: 'object', properties: { password: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
    @HttpCode(200)
    async deleteProfile(@Body() body: { password: string }, @User() user) {
        await this.usersService.deleteProfile(user.id, body.password);
        return { message: this.i18n.t('users.success.profile_deleted') };
    }

    @Get('notifications')
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'user Notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
    @ApiQuery({ name: 'page', type: Number, description: 'Page number' })
    @HttpCode(200)
    async getNotifcations(@User() user, @Query('page', ParseIntPipe) page?: string) {
        const lang = this.i18n.lang();
        const pageNum = page ? Number(page) : 1;
        return this.notificationService.getNotifications(user.id, lang, pageNum);
    }

    @Patch('notifications/:notificationId')
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Notification marked as read' })
    @ApiResponse({ status: 200, description: 'Notification marked successfully' })
    @HttpCode(200)
    async markNotificationAsRead(@Param('notificationId', ParseIntPipe) notificationId, @User() user) {
        return this.notificationService.markNotificationAsRead(notificationId, user.id);
    }

    @Get('/reservations')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get my reservations',
        description: 'Retrieves a list of reservations made by the authenticated user',
    })
    @ApiOkResponse({
        description: 'List of reservations',
        type: [ReservationResponseDto],
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getMyReservations(@User() user): Promise<ReservationResponseDto[]> {
        const lang = this.i18n.lang();
        const userId = user.id;
        const reservations = await this.reservationsService.findUserReservations(userId);
        return reservations.map((r) => ({
            id: r.id,
            date: r.date,
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
            status: r.status,
            price: r.price,
            facility: {
                id: r.facility.id,
                name: lang === 'ar' ? r.facility.name.ar : r.facility.name.en,
            },
            availabilityId: r.availability ? Number(r.availability.id) : null,
            slotId: r.slot ? Number(r.slot.id) : null,
        }));
    }

    @Get('/reservations/invoices')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get my invoices',
        description: 'Retrieves confirmed reservations with payment details',
    })
    @ApiOkResponse({
        description: 'List of invoices',
        type: [GetMyInvoicesResponseDto],
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getMyInvoices(@User() user) {
        return this.reservationsService.getMyInvoices(user.id);
    }

    @Patch('reservations/invoices/:paymentIntentId/refund')
    @Roles(UserRole.USER)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'refund a specific payment' })
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
    async ownerRefund(@Param('paymentIntentId') paymentIntentId: string, @User() user) {
        return this.paymentService.userRefundPayment(paymentIntentId, user);
    }
}
