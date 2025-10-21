import { forwardRef, Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { SchedulesService } from './schedules.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilityAvailability } from './entities/facility-availability.entity';
import { FacilitiesModule } from '../facilities/facilities.module';
import { FacilitySlot } from './entities/facility-slot.entity';
import { FacilityDayOff } from './entities/facility-days-off.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CreateFacilities } from '../facilities/services/createfacilities.service';
import { Getfacilities } from '../facilities/services/getfacilities.service';
import { Updatefacilities } from '../facilities/services/update-facilities.service';
import { CategoriesModule } from '../categories/categories.module';
import { DeleteFacility } from '../facilities/services/delete-facilities.service';
import { ReservationsModule } from '../reservations/reservations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([FacilityAvailability]),
        TypeOrmModule.forFeature([FacilitySlot]),
        TypeOrmModule.forFeature([FacilityDayOff]),
        forwardRef(() => FacilitiesModule),
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
        forwardRef(() => CategoriesModule),
        forwardRef(() => ReservationsModule),
        forwardRef(() => NotificationsModule),
        forwardRef(() => PaymentModule),
    ],
    controllers: [OwnerController],
    providers: [SchedulesService, CreateFacilities, Getfacilities, Updatefacilities, DeleteFacility],
    exports: [SchedulesService],
})
export class SchedulesModule {}
