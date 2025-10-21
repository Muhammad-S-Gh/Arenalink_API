import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    NotFoundException,
    Post,
    Put,
    Query,
    Req,
    Request,
    Res,
    UploadedFile,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDto } from './dtos/register-response.dto';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { User } from './decorators/user.decorator';
import { JwtGuard } from './guards/jwt.guard';
import { uploadInterceptor } from '../../shared/interceptors/upload.interceptor';
import { EmailConfirmationService } from './emailConfirmation.service';
import { SmsService } from '../sms/sms.service';
import { DeleteFileOnErrorFilter } from '../../shared/filter/delete-file-on-error.filter';
import { FcmDTO } from './dtos/fcm.dto';
import { ExtractJwt } from 'passport-jwt';
import { PersonalAccessTokenService } from './personal-access-token.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ResetPasswordDTO } from './dtos/reset-password.dto';
import { CompleteProfileDTO } from './dtos/complete-profile.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
// import { NoFilesInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private emailConfirmationService: EmailConfirmationService,
        private smsService: SmsService,
        private patService: PersonalAccessTokenService,
        private notificationService: NotificationsService,
        private i18n: YcI18nService,
    ) {}

    // ******************************** Auth flow
    // —— Register —— //
    @Public()
    @Post('register')
    @UseFilters(DeleteFileOnErrorFilter)
    @uploadInterceptor('profilePicture', 'profile_pictures')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: RegisterRequestDto })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', example: 'eyJhbGciOiJI…' },
            },
        },
    })
    async register(@Body() registerBody: RegisterRequestDto, @UploadedFile() file: Express.Multer.File) {
        const res = await this.authService.register(registerBody, file);
        if (registerBody.role === UserRole.OWNER) {
            this.notificationService.notifyAdminsOnOwnerRegister(registerBody.email);
        }
        return { message: this.i18n.t('auth.accountRegistered'), data: res };
    }

    // —— Resend confirmation link —— //
    @Post('resend-confirmation-link')
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Resend email confirmation link' })
    @ApiResponse({ status: 200, description: 'Link resent' })
    @HttpCode(200)
    async resendConfirmationLink(@Req() req) {
        const user = req.user;
        await this.emailConfirmationService.resendConfirmationLink(user.id);
        return { message: this.i18n.t('auth.emailConfirmationSent') };
    }

    // —— Verify email —— //
    @Public()
    @Get('verify-email')
    @ApiOperation({ summary: 'Verify email address via token' })
    @ApiQuery({
        name: 'token',
        type: String,
        description: 'Email confirmation token',
    })
    @ApiResponse({ status: 200, description: 'Email verified' })
    @HttpCode(200)
    async verifyEmail(@Query('token') token: string) {
        const email = await this.emailConfirmationService.decodeConfirmationToken(token);
        await this.emailConfirmationService.confirmEmail(email);
        return { message: this.i18n.t('auth.emailVerified') };
    }

    // —— Send OTP —— //
    @Post('send-otp')
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Send phone verification OTP' })
    @ApiResponse({ status: 200, description: 'OTP sent' })
    @HttpCode(200)
    async sendOtp(@Req() req) {
        const user = req.user;
        await this.smsService.sendOtp(user, 'Please use the code to verify your phone number');
        return { message: this.i18n.t('auth.otpSent') };
    }

    // —— Verify OTP —— //
    @Post('verify-otp')
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify phone OTP code' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { code: { type: 'string' } },
            required: ['code'],
        },
    })
    @ApiResponse({ status: 200, description: 'Phone verified' })
    @ApiResponse({ status: 404, description: 'Invalid or expired code' })
    @HttpCode(200)
    async verifyOtp(@Req() req, @Body('code') code: string) {
        const user = req.user;
        const ok = await this.smsService.verifyOtp(user, code);
        if (!ok) {
            throw new BadRequestException(this.i18n.t('auth.otpCodeInvalid'));
        }
        return { message: this.i18n.t('auth.phoneVerified') };
    }

    @Post('register-fcm-token')
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Register FCM token for push notifications' })
    @ApiBody({ type: FcmDTO })
    @ApiResponse({ status: 200, description: 'FCM token registered' })
    @HttpCode(200)
    async addFcmToken(@User() user, @Body() fcmTokenInformation: FcmDTO, @Req() req: Request) {
        const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!rawToken) {
            throw new NotFoundException(this.i18n.t('auth.tokenNotFound'));
        }
        const pat = await this.patService.findOnebyToken(user.id, rawToken);
        const fcm = await this.notificationService.findFcmByPat(pat.id);
        if (fcm) {
            throw new BadRequestException(this.i18n.t('auth.fcmExists'));
        }

        await this.notificationService.registerFcm(user, pat, fcmTokenInformation);
        return { message: this.i18n.t('auth.fcmTokenRegistered') };
    }

    // —— Logout —— //
    @Post('logout')
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and invalidate current token' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @HttpCode(200)
    async logout(@User() user, @Req() req: Request) {
        const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!rawToken) {
            throw new NotFoundException(this.i18n.t('auth.tokenNotFound'));
        }
        const pat = await this.patService.findOnebyToken(user.id, rawToken);
        await this.patService.delete(pat.id);
        // await this.notificationService.deleteFcm(pat.id); // cascade on fcm token gonna do this when deleting the pat
        return { status: 'success', message: this.i18n.t('auth.loggedOut') };
    }

    // —— Login —— //
    @Public()
    @Roles(UserRole.OWNER, UserRole.USER)
    // @UseInterceptors(NoFilesInterceptor()) // always before guards so in Login this won't work
    @UseGuards(AuthGuard('local'), RolesGuard)
    @Post('login')
    @ApiOperation({ summary: 'Login with email & password' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'strongPass123' },
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
    async login(@Request() req) {
        return { message: this.i18n.t('auth.loginDone'), data: await this.authService.login(req.user) };
    }

    // ********************************* OAuth flow web then Mobile

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/login')
    @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
    @ApiResponse({
        status: 302,
        description: 'Redirects browser to Google consent screen',
    })
    googleLogin() {}

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth2 callback' })
    @ApiResponse({
        status: 302,
        description:
            'Google redirects here with code; we exchange it, issue JWT and redirect to front‑end with token http://localhost:5173?token=${response.access_token}',
    })
    @Get('google/callback')
    async googleCallback(@User() user, @Res() res) {
        const response = await this.authService.login(user);
        res.redirect(`http://localhost:5173?token=${response.access_token}`);
    }

    @Public()
    @Post('google/mobile')
    @ApiOperation({ summary: 'Login via Google on mobile using ID token' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                idToken: {
                    type: 'string',
                    description: 'Google ID token from client SDK',
                    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
                },
            },
            required: ['idToken'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Register/Login was successful',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', example: 'eyJhbGciOiJI…' },
            },
        },
    })
    async googleMobileLogin(@Body('idToken') idToken: string) {
        return await this.authService.googleMobileLogin(idToken);
    }

    @Put('complete-profile')
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete user profile after OAuth registration' })
    @ApiBody({ type: CompleteProfileDTO })
    @ApiResponse({
        status: 200,
        description: 'Profile completed successfully',
        type: CompleteProfileDTO, // or a dedicated response DTO if you have one
    })
    @HttpCode(200)
    async updateProfile(@User() user, @Body() data: CompleteProfileDTO) {
        return { message: this.i18n.t('auth.profileCompleted'), data: this.authService.completeProfile(user, data) };
    }

    // ************************** Password

    // —— Forgot Password —— //
    @Public()
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset OTP via email' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { email: { type: 'string', example: 'user@example.com' } },
            required: ['email'],
        },
    })
    @ApiResponse({ status: 200, description: 'OTP sent to email' })
    @HttpCode(200)
    async forgotPassword(@Body('email') email: string) {
        await this.authService.forgotPassword(email);
        return { message: this.i18n.t('auth.otpSent') };
    }

    // —— Verify Password OTP —— //
    @Public()
    @Post('verify-password-otp')
    @ApiOperation({ summary: 'Verify password reset OTP' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                otp_code: { type: 'string', example: '123456' },
            },
            required: ['email', 'otp_code'],
        },
    })
    @ApiResponse({ status: 200, description: 'OTP verified' })
    @HttpCode(200)
    async verifyPasswordOtp(@Body('email') email: string, @Body('otp_code') otpCode: string) {
        return this.authService.verifyPassword(email, otpCode);
    }

    // —— Reset Password —— //
    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using OTP' })
    @ApiBody({ type: ResetPasswordDTO })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @HttpCode(200)
    async resetPassword(@Body() data: ResetPasswordDTO) {
        await this.authService.resetPassword(data);
        return { message: this.i18n.t('auth.passwordResetSuccess') };
    }

    // —— Confirm Password —— //
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @Post('confirm-password')
    @ApiOperation({ summary: 'Confirm password before sensitive actions' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: { password: { type: 'string' } },
            required: ['password'],
        },
    })
    @ApiResponse({ status: 200, description: 'Password confirmed' })
    @HttpCode(200)
    async confirmPassword(@User() user, @Body('password') password) {
        await this.authService.confirmPassword(user, password);
        return { message: this.i18n.t('auth.passwordConfirmed') };
    }
}
