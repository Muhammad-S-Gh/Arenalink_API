import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/users.entity';
import { PasswordResetOtpService } from './password-reset-otp.service';
import { compare, hash } from 'bcrypt';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';

@Injectable()
export class GmailOtpService {
    private minutes: number = 60;

    constructor(
        private readonly mailService: MailService,
        private readonly passwordOtpService: PasswordResetOtpService,
        private readonly i18n: YcI18nService,
        //
    ) {}

    // we need combinations from 0000 to 9999
    private generateCode(digits: number = 4) {
        const start = 10 ** (digits - 1); // 1000
        const range = 10 ** digits - start; // 9000
        return Math.floor(start + Math.random() * range); // 0~0.9999 * 9000
    }

    async sendGmailOtp(user: User, message: string) {
        const otp = this.generateCode().toString();
        this.passwordOtpService.create({
            otpCode: await hash(otp, 10),
            expiresAt: new Date(Date.now() + this.minutes * 60_000),
            user,
        });

        const template = this.i18n.lang() === 'ar' ? 'ar-password-reset-email' : 'password-reset-email';
        const subject = this.i18n.lang() === 'ar' ? 'رمز تغيير كلمة المرور' : 'Password reset OTP';

        return this.mailService.sendEmail({
            to: user.email,
            subject,
            template,
            context: {
                otp,
                message,
            },
        });
    }

    async verifyGmailOtp(user: User, otp: string) {
        const lastOtp = await this.passwordOtpService.findUserResetOtps(user);
        const isValid = await compare(otp, lastOtp.otpCode);
        const isFresh = lastOtp.expiresAt > new Date();

        if (isValid && isFresh) {
            this.passwordOtpService.verifyPasswordOtp(lastOtp.id);
            return true;
        }
        return false;
    }
}
