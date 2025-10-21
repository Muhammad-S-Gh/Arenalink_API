import { forwardRef, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailController } from './mail.controller';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get('SMTP_HOST'),
                    port: config.get('SMTP_PORT'),
                    auth: {
                        user: config.get('SMTP_USER'),
                        pass: config.get('SMTP_PASSWORD'),
                    },
                    secure: false,
                    tls: {
                        rejectUnauthorized: false,
                    },
                },
                defaults: {
                    from: config.get('EMAIL_FROM_ADDRESS'),
                },
                template: {
                    dir: __dirname + '/templates',
                    adapter: new PugAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [MailService],
    exports: [MailService],
    controllers: [MailController],
})
export class MailModule {}
