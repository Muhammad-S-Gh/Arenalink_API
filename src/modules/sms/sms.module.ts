import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PhonesModule } from '../phones/phones.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [ConfigModule, HttpModule, PhonesModule, UsersModule],
    providers: [SmsService],
    exports: [SmsService],
})
export class SmsModule {}
