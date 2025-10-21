import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/users.entity';
import * as bcrypt from 'bcrypt';
import { AccessToken } from './types/AccessToken';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { CreateUserDTO } from './dtos/create-user.dto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { PhonesService } from '../phones/phones.service';
import { EmailConfirmationService } from './emailConfirmation.service';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { OwnersService } from '../users/owners.service';
import { OwnerStatus } from '../../shared/enums/owner-statuses.enum';
import { PersonalAccessTokenService } from './personal-access-token.service';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { GmailOtpService } from './gmail-otp.service';
import { ResetPasswordDTO } from './dtos/reset-password.dto';
import { PasswordResetOtpService } from './password-reset-otp.service';
import { CompleteProfileDTO } from './dtos/complete-profile.dto';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';

@Injectable()
export class AuthService {
    private googleClient = new OAuth2Client();
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private config: ConfigService,
        private phonesService: PhonesService,
        private emailConfirmation: EmailConfirmationService,
        private ownersService: OwnersService,
        private patSerivce: PersonalAccessTokenService,
        private gmailOtpService: GmailOtpService,
        private passwordResetService: PasswordResetOtpService,
        private i18n: YcI18nService,
    ) {}

    //

    // ************************************************************** Auth

    //

    async validateUser(email: string, password: string): Promise<User> {
        const user: User | null = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new BadRequestException(this.i18n.t('auth.userNotFound'));
        }
        const isMatch: boolean = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new BadRequestException(this.i18n.t('auth.passwordMismatch'));
        }
        return user;
    }

    async login(user: Partial<User>): Promise<AccessToken> {
        const payload = { userId: user.id, email: user.email };
        const rawToken = this.jwtService.sign(payload);

        const saltRound = 10;
        const hashedToken = await bcrypt.hash(rawToken, saltRound);

        const ttl = parseInt(this.config.getOrThrow<string>('ACCESS_TOKEN_EXPIRATION'), 10);
        const expiresAt = new Date(Date.now() + ttl * 1000);

        await this.patSerivce.create({
            tokenableType: 'User',
            tokenableId: user.id,
            token: hashedToken,
            expiresAt,
        });

        return { access_token: rawToken };
    }

    async register(user: RegisterRequestDto, file: Express.Multer.File): Promise<AccessToken> {
        const existingUser = await this.usersService.findOneByEmail(user.email);
        if (existingUser) {
            throw new BadRequestException(this.i18n.t('auth.emailAlreadyExists'));
        }

        if (user.role && user.role === UserRole.ADMIN) {
            throw new BadRequestException(this.i18n.t('auth.invalidRole'));
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);
        const profilePicturePath = file ? `uploads/profile_pictures/${file.filename}` : undefined;

        const newUser = await this.usersService.create({
            ...user,
            password: hashedPassword,
            profilePicture: profilePicturePath,
        });
        const phone = await this.phonesService.create({
            phoneNumber: user.phoneNumber,
            user: newUser,
        });
        if (user.role === UserRole.OWNER) {
            await this.ownersService.create({
                status: OwnerStatus.PENDING,
                user: newUser,
            });
        }
        await this.emailConfirmation.sendVerificationLink(newUser.email);
        return this.login(newUser);
    }
    // @Interval(10000) // 10 seconds
    @Cron(CronExpression.EVERY_HOUR) // from left to right sec/min/hours/day of the month/month/day of the week
    async deleteExpiredPAT() {
        console.log('deleting expired pats...');
        return this.patSerivce.deleteExpiredPats();
    }

    //

    // ************************************************* OAuth

    //

    async validateGoogleUser(googleUser: CreateUserDTO) {
        const user = await this.usersService.findOneByEmail(googleUser.email);
        if (user) return user;
        return await this.usersService.create({
            ...googleUser,
            emailVerifiedAt: new Date(),
        });
    }

    async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: [
                this.config.getOrThrow<string>('googleOAuth.webClientId'), // just for testing
                this.config.getOrThrow<string>('googleOAuth.androidClientId'),
                this.config.getOrThrow<string>('googleOAuth.iosClientId'),
            ],
        });
        if (!ticket) {
            throw new NotFoundException();
        }

        return ticket.getPayload()!;
    }

    private async findOrCreateUser(payload: TokenPayload): Promise<User> {
        console.log(payload);
        if (!payload.email) {
            throw new UnauthorizedException(this.i18n.t('auth.googleTokenMissingEmail'));
        }
        let user = await this.usersService.findOneByEmail(payload.email);
        if (!user) {
            user = await this.usersService.create({
                email: payload.email,
                firstName: payload.given_name,
                lastName: payload.family_name,
                profilePicture: payload.picture,
                password: '',
                emailVerifiedAt: new Date(),
            });
        }
        return user;
    }

    async googleMobileLogin(idToken: string): Promise<AccessToken> {
        const payload = await this.verifyGoogleIdToken(idToken);
        const user = await this.findOrCreateUser(payload);
        return await this.login(user);
    }

    async completeProfile(user: User, data: CompleteProfileDTO) {
        await this.usersService.update(user.id, {
            password: await bcrypt.hash(data.password, 10),
            latitude: data.latitude,
            longitude: data.longitude,
            location: data.location,
        });

        if (data.role) {
            if (data.role === UserRole.ADMIN) throw new BadRequestException(this.i18n.t('auth.invalidRole'));
            await this.usersService.update(user.id, { role: data.role });
            if (data.role === UserRole.OWNER) {
                await this.ownersService.create({
                    status: OwnerStatus.PENDING,
                    user,
                });
            }
        }
        await this.phonesService.create({
            phoneNumber: data.phoneNumber,
            user,
        });

        const completedUser = await this.usersService.findOneByIdWithRelations(user.id);
        return { message: 'Profile completed', data: completedUser };
    }

    //

    //

    // ********************************************************* Password

    async forgotPassword(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException(this.i18n.t('auth.userNotFound'));
        }
        return this.gmailOtpService.sendGmailOtp(user, 'Please use this code to reset your Password.');
    }

    async verifyPassword(email: string, otpCode: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException(this.i18n.t('auth.userNotFound'));
        }
        const ok = await this.gmailOtpService.verifyGmailOtp(user, otpCode);
        if (!ok) {
            throw new BadRequestException(this.i18n.t('auth.invalidOtp'));
        }
        return { reset_password: `${this.config.getOrThrow('APP_URL')}/auth/reset-password` };
    }

    async resetPassword(data: ResetPasswordDTO) {
        const user = await this.usersService.findOneByEmail(data.email);
        if (!user) {
            throw new NotFoundException(this.i18n.t('auth.userNotFound'));
        }
        const lastOtp = await this.passwordResetService.findUserResetOtps(user);
        if (!lastOtp || lastOtp.verifiedAt === null) {
            throw new BadRequestException(this.i18n.t('auth.otpVerificationRequired'));
        }
        this.usersService.update(user.id, {
            password: await bcrypt.hash(data.password, 10),
        });
        this.passwordResetService.deleteUserPasswordOtps(user);
        return { message: 'Your password has been reset.' };
    }

    async confirmPassword(user: User, password: string) {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) throw new BadRequestException(this.i18n.t('auth.passwordMismatch'));
        return this.usersService.confirmPassword(user.email);
    }
}
