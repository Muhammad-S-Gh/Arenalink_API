import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import dataSource from './db/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PhonesModule } from './modules/phones/phones.module';
import * as dotenv from 'dotenv';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './modules/auth/guards/jwt.guard';
import { JwtStrategy } from './modules/auth/strategy/jwt.strategy';
import { YcI18nModule } from './modules/yc-i18n/yc-i18n.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MailModule } from './modules/mail/mail.module';
import { SmsModule } from './modules/sms/sms.module';
import { IsUniqueConstraint } from './shared/validators/is-unique.constraint';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MailController } from './modules/mail/mail.controller';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SharedModule } from './shared/shared.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PaymentModule } from './modules/payment/payment.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import * as Joi from 'joi';
dotenv.config();

@Module({
    imports: [
        ConfigModule.forRoot({
            validationSchema: Joi.object({
                STRIPE_SECRET_KEY: Joi.string(),
                STRIPE_CURRENCY: Joi.string(),
                FRONTEND_URL: Joi.string(),
            }),
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        ServeStaticModule.forRoot({
            rootPath: path.join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: () => ({}),
            dataSourceFactory: async () => {
                if (!dataSource.isInitialized) {
                    await dataSource.initialize();
                }
                return dataSource;
            },
            inject: [ConfigService],
        }),
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            loaderOptions: {
                path: path.join(__dirname, '/locales/'),
                watch: true,
            },
            resolvers: [new QueryResolver(['lang']), AcceptLanguageResolver, new HeaderResolver(['locale'])],
            typesOutputPath: path.join(process.cwd(), 'src/shared/types/i18n.generated.ts'),
        }),
        AuthModule,
        UsersModule,
        PhonesModule,
        YcI18nModule,
        CategoriesModule,
        MailModule,
        SmsModule,
        NotificationsModule,
        SharedModule,
        FacilitiesModule,
        SchedulesModule,
        ReservationsModule,
        PaymentModule,
        FavoritesModule,
    ],
    controllers: [AppController, MailController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtGuard,
        },
        JwtStrategy,
        IsUniqueConstraint,
    ],
})
export class AppModule {}
