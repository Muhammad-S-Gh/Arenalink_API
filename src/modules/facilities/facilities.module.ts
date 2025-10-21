import { forwardRef, Module } from '@nestjs/common';
import { CreateFacilities } from './services/createfacilities.service';
import { FacilitiesController } from './facilities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facility } from './entities/facility.entity';
import { FacilityAttributeValue } from './entities/facility-attribute-value.entity';
import { UsersModule } from '../users/users.module';
import { CategoriesModule } from '../categories/categories.module';
import { Getfacilities } from './services/getfacilities.service';
import { Updatefacilities } from './services/update-facilities.service';
import { DeleteFacility } from './services/delete-facilities.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { AuthModule } from '../auth/auth.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Facility, FacilityAttributeValue, Reservation, Favorite]),
        forwardRef(() => UsersModule),
        forwardRef(() => CategoriesModule),
        forwardRef(() => SchedulesModule),
        forwardRef(() => AuthModule),
        forwardRef(() => NotificationsModule),
        forwardRef(() => ReservationsModule),
    ],
    providers: [Getfacilities, CreateFacilities, Updatefacilities, DeleteFacility],
    controllers: [FacilitiesController],
    exports: [Getfacilities, TypeOrmModule, Updatefacilities],
})
export class FacilitiesModule {}
