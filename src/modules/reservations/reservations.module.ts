import { forwardRef, Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { AuthModule } from '../auth/auth.module';
import { FacilitiesModule } from '../facilities/facilities.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { PaymentModule } from '../payment/payment.module';
import { StripeService } from './stripe.service';
import { ChargeController } from './charge.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Reservation]),
        forwardRef(() => AuthModule),
        forwardRef(() => FacilitiesModule),
        forwardRef(() => SchedulesModule),
        forwardRef(() => PaymentModule),
        //
    ],
    providers: [ReservationsService, StripeService],
    controllers: [ReservationsController, ChargeController],
    exports: [ReservationsService, StripeService],
})
export class ReservationsModule {}
