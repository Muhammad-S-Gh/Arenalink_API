import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { VerificationTokenPayload } from './types/VerificationTokenPayload';
import { UsersService } from '../users/users.service';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';

@Injectable()
export class EmailConfirmationService {
    constructor(
        private i18n: YcI18nService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    public async sendVerificationLink(email: string) {
        const payload: VerificationTokenPayload = { email };
        const token = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: `${this.configService.get('ACCESS_TOKEN_EXPIRATION')}`,
        });

        const url = `${this.configService.get('APP_URL')}/auth/verify-email?token=${token}`;

        const template = this.i18n.lang() === 'ar' ? 'ar-signup-confirmation-email' : 'signup-confirmation-email';
        const subject = this.i18n.lang() === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Email confirmation';

        await this.mailService.sendEmail({
            to: email,
            subject,
            template,
            context: {
                verificationUrl: url,
            },
        });

        return { message: this.i18n.t('auth.emailConfirmationSent') };
    }

    public async confirmEmail(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (user?.emailVerifiedAt) {
            throw new BadRequestException(this.i18n.t('auth.emailAlreadyVerified'));
        }
        await this.usersService.markEmailAsConfirmed(email);
        return { message: this.i18n.t('auth.emailVerified') };
    }

    public async decodeConfirmationToken(token: string) {
        try {
            const payload = await this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            if (typeof payload === 'object' && 'email' in payload) {
                return payload.email;
            }
            throw new BadRequestException(this.i18n.t('auth.badConfirmationToken'));
        } catch (error) {
            if (error?.name === 'TokenExpiredError') {
                throw new BadRequestException(this.i18n.t('auth.emailConfirmationTokenExpired'));
            }
            throw new BadRequestException(this.i18n.t('auth.badConfirmationToken'));
        }
    }

    public async resendConfirmationLink(userId: number) {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new BadRequestException(this.i18n.t('auth.userNotFound'));
        }
        if (user.emailVerifiedAt) {
            throw new BadRequestException(this.i18n.t('auth.emailAlreadyVerified'));
        }
        await this.sendVerificationLink(user.email);
    }
}
