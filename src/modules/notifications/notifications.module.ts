import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFcmToken } from './entities/user-fcm-tokens.entity';
import { Notifications } from './entities/notifications.entity';
import { User } from '../users/entities/users.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserFcmToken, Notifications, User, Reservation])],
    providers: [NotificationsService],
    controllers: [NotificationsController],
    exports: [NotificationsService],
})
export class NotificationsModule {}
