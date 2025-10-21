import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './auth.controller';

import { PasswordResetOtp } from './entities/password-reset-otps.entity';
import { PersonalAccessToken } from './entities/personal-access-tokens.entity';
import { Phone } from '../phones/phones.entity';
import googleOauthConfig from './config/google-oauth.config';
import { GoogleStrategy } from './strategy/google.strategy';
import { PhonesModule } from '../phones/phones.module';
import { EmailConfirmationService } from './emailConfirmation.service';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { SharedModule } from '../../shared/shared.module';
import { PassportModule } from '@nestjs/passport';
import { NotificationsModule } from '../notifications/notifications.module';
import { PersonalAccessTokenService } from './personal-access-token.service';
import { ScheduleModule } from '@nestjs/schedule';
import { GmailOtpService } from './gmail-otp.service';
import { PasswordResetOtpService } from './password-reset-otp.service';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PasswordResetOtp]),
        ScheduleModule.forRoot(),
        ConfigModule.forFeature(googleOauthConfig),
        forwardRef(() => UsersModule),
        forwardRef(() => MailModule),
        forwardRef(() => PaymentModule),
        PhonesModule,
        SmsModule,
        SharedModule,
        forwardRef(() => NotificationsModule),

        PassportModule,
        TypeOrmModule.forFeature([PasswordResetOtp, PersonalAccessToken, Phone]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: parseInt(configService.getOrThrow<string>('ACCESS_TOKEN_EXPIRATION')),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        PersonalAccessTokenService,
        LocalStrategy,
        JwtStrategy,
        GoogleStrategy,
        EmailConfirmationService,
        GmailOtpService,
        PasswordResetOtpService,
    ],
    exports: [AuthService, JwtModule, EmailConfirmationService, PersonalAccessTokenService],
})
export class AuthModule {}
