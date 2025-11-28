import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    NotFoundException,
    Param,
    ParseFilePipe,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
    Request,
    UploadedFile,
    UploadedFiles,
    UseFilters,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UsersService } from './users.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { RolesGuard } from '../../shared/guards\/roles.guard';
import { OwnerStatus } from '../../shared/enums/owner-statuses.enum';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ChangeOwnerStatusDto } from './dtos/change-owner-status.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { PersonalAccessTokenService } from '../auth/personal-access-token.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginResponseDto } from '../auth/dtos/login-response.dto';
import { User } from '../auth/decorators/user.decorator';
import { ExtractJwt } from 'passport-jwt';
import { ResetPasswordDTO } from '../auth/dtos/reset-password.dto';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { ChangePasswordDTO } from './dtos/change-password.dto';
import { DeleteFileOnErrorFilter } from '../../shared/filter/delete-file-on-error.filter';
import { uploadInterceptor } from '../../shared/interceptors/upload.interceptor';
import { UpdateProfileDTO } from './dtos/update-profile.dto';
import { CategoriesService } from '../categories/services/categories.service';
import { CreateCategoryService } from '../categories/services/create_categories.service';
import { UpdateCategoriesService } from '../categories/services/update_categories.service';
import { CreateAttributeDto } from '../categories/dto/create_attribute.dto';
import { AttributeType } from '../categories/enums/attributeType.enum';
import { UpdateFacilityStatusDto } from '../facilities/dtos/update-facility-status.dto';
import { Updatefacilities } from '../facilities/services/update-facilities.service';
import { DeleteFacility } from '../facilities/services/delete-facilities.service';
import { GetApprovedReservationsResponseDto } from '../schedules/dtos/owner-approved-reservations.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('admin')
export class AdminsController {
    constructor(
        private usersService: UsersService,
        private authService: AuthService,
        private patService: PersonalAccessTokenService,
        private i18n: YcI18nService,
        private readonly categoryService: CategoriesService,
        private readonly createCategoryService: CreateCategoryService,
        private readonly updateCategoryService: UpdateCategoriesService,
        private readonly updateFacilitiesService: Updatefacilities,
        private readonly deleteFacilityService: DeleteFacility,
        private readonly reservationService: ReservationsService,
        private readonly notificationsService: NotificationsService,
    ) {}

    @Public()
    @UseGuards(AuthGuard('local'))
    @Post('login')
    @ApiOperation({ summary: 'Login with email & password' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'admin@admin.com' },
                password: { type: 'string', example: '123456789' },
            },
            required: ['email', 'password'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful—returns access token',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', example: 'eyJhbGciOiJI…' },
            },
        },
    })
    @HttpCode(200)
    async login(@Request() req): Promise<LoginResponseDto | BadRequestException> {
        if (req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(this.i18n.t('users.errors.unauthorized'));
        }
        return this.authService.login(req.user);
    }

    @Post('logout')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and invalidate current token' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @HttpCode(200)
    async logout(@User() user, @Req() req: Request) {
        const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!rawToken) {
            throw new NotFoundException('Token not found in authorization header');
        }
        const pat = await this.patService.findOnebyToken(user.id, rawToken);
        await this.patService.delete(pat.id);
        return { status: 'success', message: this.i18n.t('users.success.logged_out') };
    }

    @Public()
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset OTP via email' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { email: { type: 'string', example: 'admin@admin.com' } },
            required: ['email'],
        },
    })
    @ApiResponse({ status: 200, description: 'OTP sent to email' })
    async forgotPassword(@Body('email') email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new BadRequestException(this.i18n.t('users.errors.user_not_found'));
        }
        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(this.i18n.t('users.errors.unauthorized'));
        }
        await this.authService.forgotPassword(email);
        return { message: this.i18n.t('auth.otpSent') };
    }

    @Public()
    @Post('verify-password-otp')
    @ApiOperation({ summary: 'Verify password reset OTP' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'admin@admin.com' },
                otp_code: { type: 'string', example: '123456' },
            },
            required: ['email', 'otp_code'],
        },
    })
    @ApiResponse({ status: 200, description: 'OTP verified' })
    async verifyPasswordOtp(@Body('email') email: string, @Body('otp_code') otpCode: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new BadRequestException(this.i18n.t('auth.userNotFound'));
        }

        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(this.i18n.t('users.errors.unauthorized'));
        }

        return this.authService.verifyPassword(email, otpCode);
    }

    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using OTP' })
    @ApiBody({ type: ResetPasswordDTO })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    async resetPassword(@Body() data: ResetPasswordDTO) {
        const user = await this.usersService.findOneByEmail(data.email);
        if (!user) {
            throw new BadRequestException(this.i18n.t('users.errors.user_not_found'));
        }
        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(this.i18n.t('users.errors.unauthorized'));
        }
        await this.authService.resetPassword(data);
        return { message: this.i18n.t('auth.passwordResetSuccess') };
    }

    @Put('change-password')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Change admin password' })
    @ApiBody({ type: ChangePasswordDTO })
    @ApiResponse({ status: 200, description: 'Password updated successfully' })
    @HttpCode(200)
    async changePassword(@Body() dto: ChangePasswordDTO, @User() user) {
        await this.usersService.changePassword(user, dto);
        return { message: this.i18n.t('users.success.password_updated') };
    }

    @Patch('update')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @UseFilters(DeleteFileOnErrorFilter)
    @uploadInterceptor('profilePicture', 'profile_pictures')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateProfileDTO })
    @ApiOperation({ summary: 'Update admin profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @HttpCode(200)
    updateProfile(
        @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file: Express.Multer.File,
        @Body() dto: UpdateProfileDTO,
        @User() user,
    ) {
        return this.usersService.updateProfile(file, user, dto);
    }

    @Get('users')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'List of all users' })
    @HttpCode(200)
    async getAllUsers() {
        return this.usersService.findAll();
    }

    @Get('users/:id')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User details' })
    @ApiResponse({ status: 400, description: 'Invalid ID' })
    @HttpCode(200)
    async getUser(@Param('id', ParseIntPipe) userId: number) {
        const user = await this.usersService.findOneByIdWithRelations(userId);
        if (!user) {
            throw new NotFoundException(this.i18n.t('users.errors.user_not_found'));
        }
        return user;
    }

    @Get('owners')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Get pending owner registrations' })
    @ApiResponse({ status: 200, description: 'List of pending owners' })
    @HttpCode(200)
    async getPendingOwners() {
        return this.usersService.getPendingOwners();
    }

    @Patch('owners/:id')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Change owner status' })
    @ApiParam({ name: 'id', type: Number, description: 'Owner ID' })
    @ApiBody({ type: ChangeOwnerStatusDto })
    @ApiResponse({ status: 200, description: 'Status changed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid status supplied' })
    @HttpCode(200)
    async changeOwnerStatus(@Param('id', ParseIntPipe) ownerId: number, @Body() dto: ChangeOwnerStatusDto) {
        const newStatus = dto.status;
        if (newStatus === OwnerStatus.PENDING) {
            throw new BadRequestException(this.i18n.t('users.errors.invalid_status'));
        }
        return {
            message: this.i18n.t('users.success.status_changed'),
            data: await this.usersService.updateOwner(ownerId, newStatus),
        };
    }

    // **********************************************************

    @Get('notifications')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Admin Notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
    @ApiQuery({ name: 'page', type: Number, description: 'Page number' })
    @HttpCode(200)
    async getNotifcations(@User() user, @Query('page', ParseIntPipe) page?: string) {
        const lang = this.i18n.lang();
        const pageNum = page ? Number(page) : 1;
        return this.notificationsService.getNotifications(user.id, lang, pageNum);
    }

    @Patch('notifications/:notificationId')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Notification marked as read' })
    @ApiResponse({ status: 200, description: 'Notification marked successfully' })
    @HttpCode(200)
    async markNotificationAsRead(@Param('notificationId', ParseIntPipe) notificationId, @User() user) {
        return this.notificationsService.markNotificationAsRead(notificationId, user.id);
    }

    // ***********************************************************

    @Roles(UserRole.ADMIN)
    @Post('categories')
    @UseFilters(DeleteFileOnErrorFilter)
    @uploadInterceptor('icon', 'categories')
    @ApiOperation({ summary: 'Create a basic category (name, icon, description only)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: '{"en":"Football","ar":"كرة القدم"}',
                },
                description: {
                    type: 'string',
                    example: '{"en":"Football description","ar":"وصف كرة القدم"}',
                },
                icon: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Category created successfully (basic).' })
    @ApiResponse({ status: 400, description: 'Invalid input or error while creating category.' })
    async createBasic(@Body() dto: any, @UploadedFile() icon: Express.Multer.File) {
        try {
            if (typeof dto.name === 'string') {
                dto.name = JSON.parse(dto.name);
            }
            if (typeof dto.description === 'string') {
                dto.description = JSON.parse(dto.description);
            }

            const iconPath = `uploads/categories/${icon.filename}`;
            return await this.createCategoryService.create(dto, iconPath);
        } catch (error) {
            throw new HttpException('Failed to create category: ' + error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Roles(UserRole.ADMIN)
    @Patch('categories/:id')
    @UseFilters(DeleteFileOnErrorFilter)
    @uploadInterceptor('icon', 'categories')
    @ApiOperation({ summary: 'Update an existing category' })
    @ApiConsumes('multipart/form-data')
    @ApiParam({ name: 'id', type: String })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: '{"en":"Updated Football","ar":"كرة القدم المعدلة"}',
                },
                description: {
                    type: 'string',
                    example: '{"en":"Updated description","ar":"الوصف المعدل"}',
                },
                icon: {
                    type: 'string',
                    format: 'binary',
                    description: 'Optional new category icon',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Category updated successfully.' })
    @ApiResponse({ status: 404, description: 'Category not found.' })
    async update(@Param('id') id: number, @Body() updateCategoryDto: any, @UploadedFile() icon?: Express.Multer.File) {
        try {
            if (typeof updateCategoryDto.name === 'string') {
                updateCategoryDto.name = JSON.parse(updateCategoryDto.name);
            }

            if (typeof updateCategoryDto.description === 'string') {
                updateCategoryDto.description = JSON.parse(updateCategoryDto.description);
            }

            if (icon) {
                updateCategoryDto.icon = `uploads/categories/${icon.filename}`;
            }

            return await this.updateCategoryService.update(id, updateCategoryDto);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw new HttpException('Failed to update category: ' + error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Delete('categories/attributes/:id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete an attribute by ID' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Attribute deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Attribute not found.' })
    async deleteAttribute(@Param('id') id: number): Promise<void> {
        await this.updateCategoryService.deleteAttribute(id);
    }

    @Post('categories/:categoryId/attributes')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Add attribute to existing category' })
    @ApiParam({ name: 'categoryId', type: Number })
    @ApiBody({ type: CreateAttributeDto })
    @ApiResponse({ status: 201, description: 'Attribute added successfully.' })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            exceptionFactory: (errors) => {
                const result = errors.map((error) => ({
                    property: error.property,
                    message: Object.values(error.constraints!)[0],
                }));
                return new BadRequestException(result);
            },
        }),
    )
    async addAttributeToCategory(
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Body() createAttributeDto: CreateAttributeDto,
    ) {
        if (createAttributeDto.type !== AttributeType.NUMBER) {
            delete createAttributeDto.maxLimit;
            delete createAttributeDto.minLimit;
        }
        if (createAttributeDto.type !== AttributeType.ENUM) {
            delete createAttributeDto.options;
        }
        return this.updateCategoryService.addAttributeToCategory(categoryId, createAttributeDto);
    }

    @Delete('categories/:id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete category with its attributes and options' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Category and all its attributes deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Category not found.' })
    async deleteCategory(@Param('id') id: number): Promise<void> {
        await this.updateCategoryService.deleteCategory(id);
    }

    // ****************************************************

    @Roles(UserRole.ADMIN)
    @Patch('facilities/:id/status')
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({
        summary: 'Admin changes facility status so no one can make reservation for this facility',
    })
    @ApiParam({ name: 'id', type: Number, description: 'facility ID' })
    @ApiResponse({ status: 200, description: 'User status changed successfully' })
    @ApiResponse({ status: 400, description: 'User not found' })
    async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFacilityStatusDto, @User() user) {
        return this.updateFacilitiesService.updateStatus(id, dto, user);
    }

    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete facility' })
    @ApiResponse({ status: 200, description: 'Facility deleted successfully' })
    @ApiResponse({ status: 400, description: 'Facility status is active' })
    @ApiResponse({ status: 400, description: 'Facility has reservations' })
    @Delete('facilities/:id')
    async deleteFacility(@Param('id') id: number, @User() user) {
        return this.deleteFacilityService.deleteFacility(Number(id), user);
    }

    // ***************************************************

    @Patch('users/:id')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({
        summary:
            'Admin toggles specific user status to false or to true to forbid the user from making reservations or to give the user the ability of making reservation again',
    })
    @ApiParam({ name: 'id', type: Number, description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User status changed successfully' })
    @ApiResponse({ status: 400, description: 'User not found' })
    async changeUserStatus(@Param('id', ParseIntPipe) id) {
        return this.usersService.changeUserStatus(id);
    }

    @Delete('users/:id')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
    @ApiOperation({ summary: 'Admin deletes specific user (end-user/owner)' })
    @ApiParam({ name: 'id', type: Number, description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 400, description: 'User have future reservation' })
    async deleteUser(@Param('id', ParseIntPipe) id) {
        return this.usersService.adminDelete(id);
    }

    @Get('facilities/:facilityId/reservations')
    @Roles(UserRole.ADMIN)
    @UseGuards(JwtGuard, RolesGuard)
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
        return this.reservationService.getApprovedReservations(facilityId);
    }
}
