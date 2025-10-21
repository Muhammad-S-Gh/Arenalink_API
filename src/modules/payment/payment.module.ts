import { forwardRef, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { ReservationsModule } from '../reservations/reservations.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { FacilitiesModule } from '../facilities/facilities.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
        forwardRef(() => ReservationsModule),
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
        forwardRef(() => FacilitiesModule),
        //
    ],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}
