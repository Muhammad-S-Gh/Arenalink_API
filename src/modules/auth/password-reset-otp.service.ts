import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetOtp } from './entities/password-reset-otps.entity';
import { User } from '../users/entities/users.entity';

@Injectable()
export class PasswordResetOtpService {
    constructor(
        @InjectRepository(PasswordResetOtp)
        private readonly passwordOtpRepo: Repository<PasswordResetOtp>,
    ) {}

    create(otp: Partial<PasswordResetOtp>): Promise<PasswordResetOtp> {
        const passwordOtp = this.passwordOtpRepo.create(otp);
        return this.passwordOtpRepo.save(passwordOtp);
    }

    async findUserResetOtps(user: User) {
        console.log(user);

        const otp = await this.passwordOtpRepo.findOne({
            where: { user: { id: user.id } },
            order: { createdAt: 'DESC' },
        });
        console.log(otp);

        if (!otp || otp.expiresAt < new Date()) {
            throw new NotFoundException('Password Otp not found or expired');
        }
        return otp;
    }

    async verifyPasswordOtp(otpId: number) {
        return await this.passwordOtpRepo.update(otpId, { verifiedAt: new Date() });
    }

    async deleteUserPasswordOtps(user: User) {
        return await this.passwordOtpRepo.delete({ user });
    }
}
