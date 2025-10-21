import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OwnersService } from './owners.service';
import { Owner } from './entities/owners.entity';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PhonesModule } from '../phones/phones.module';
import { AdminsController } from './admins.controller';
import { ReservationsModule } from '../reservations/reservations.module';
import { CategoriesService } from '../categories/services/categories.service';
import { CreateCategoryService } from '../categories/services/create_categories.service';
import { UpdateCategoriesService } from '../categories/services/update_categories.service';
import { CategoriesModule } from '../categories/categories.module';
import { FacilitiesModule } from '../facilities/facilities.module';
import { DeleteFacility } from '../facilities/services/delete-facilities.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([Owner]),
        forwardRef(() => AuthModule),
        forwardRef(() => MailModule),
        PhonesModule,
        forwardRef(() => ReservationsModule),
        forwardRef(() => CategoriesModule),
        forwardRef(() => FacilitiesModule),
        forwardRef(() => NotificationsModule),
        forwardRef(() => PaymentModule),
    ],
    providers: [
        UsersService,
        OwnersService,
        CategoriesService,
        CreateCategoryService,
        UpdateCategoriesService,
        DeleteFacility,
    ],
    controllers: [UsersController, AdminsController],
    exports: [TypeOrmModule, UsersService, OwnersService],
})
export class UsersModule {}
