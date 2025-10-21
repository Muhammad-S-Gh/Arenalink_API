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

    /**
     * Handles sending OTP code over SMS:
     * 1. Checks user phone exists
     * 2. Generates & hashes OTP
     * 3. Saves code and expiration in Phone entity
     * 4. Sends SMS via HTTP gateway
     * 5. Logs the operation
     */
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

        // HTTP POST returns an Observable; convert to Promise via lastValueFrom
        const response = await lastValueFrom(
            this.http.post(
                url,
                { to: phone.phoneNumber, message: `${message} ${code}` },
                { headers: { Authorization: key } },
            ),
        );
        // Warning: lastValueFrom will reject if observable errors or does not complete :contentReference[oaicite:1]{index=1}

        this.logger.log(`OTP ${code} sent to ${phone.phoneNumber}`);
    }

    /**
     * Verifies an OTP code:
     * 1. Fetches Phone entity
     * 2. Compares plain code to hashed code
     * 3. Checks if code is not expired
     * 4. If valid, updates user's verified timestamp
     */
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
