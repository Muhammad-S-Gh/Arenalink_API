import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/users.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PhonesService } from '../phones/phones.service';
import { compare, hash } from 'bcrypt';
import { lastValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private minutes: number = 60;

    constructor(
        private http: HttpService,
        private readonly phoneService: PhonesService,
        private readonly usersService: UsersService,
        private readonly config: ConfigService,
        private readonly i18n: YcI18nService,
    ) {}

    private generateCode(digits: number = 4): number {
        const start = 10 ** (digits - 1);
        const range = 10 ** digits - start;
        return Math.floor(start + Math.random() * range);
    }

    async sendOtp(user: User, message: string): Promise<void> {
        const phone = await this.phoneService.findForUser(user.id);
        if (!phone) {
            throw new NotFoundException(this.i18n.t('auth.phoneNumberNotFound'));
        }

        const code = this.generateCode().toString();

        await this.phoneService.update(user.id, {
            phoneNumberOtpCode: await hash(code, 10),
            phoneNumberOtpExpiredDate: new Date(Date.now() + this.minutes * 60_000),
        });

        const url = this.config.getOrThrow<string>('SMS_GATEWAY_URL');
        const key = this.config.getOrThrow<string>('SMS_GATEWAY_APIKEY');

        const response = await lastValueFrom(
            this.http.post(
                url,
                { to: phone.phoneNumber, message: `${message} ${code}` },
                { headers: { Authorization: key } },
            ),
        );

        this.logger.log(`OTP ${code} sent to ${phone.phoneNumber}`);
    }

    async verifyOtp(user: User, code: string): Promise<boolean> {
        const phone = await this.phoneService.findForUser(user.id);
        if (!phone) {
            throw new BadRequestException(this.i18n.t('auth.noPhoneRecord'));
        }
        if (!phone.phoneNumberOtpCode || !phone.phoneNumberOtpExpiredDate) {
            throw new NotFoundException(this.i18n.t('auth.otpCodeMissing'));
        }

        const isValid = await compare(code, phone.phoneNumberOtpCode);
        const isFresh = phone.phoneNumberOtpExpiredDate > new Date();

        if (!isValid || !isFresh) {
            return false;
        }

        await this.usersService.update(user.id, { verifiedAt: new Date() });
        return true;
    }
}
