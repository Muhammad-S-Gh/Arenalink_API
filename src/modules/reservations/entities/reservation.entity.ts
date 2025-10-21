import { FacilityAvailability } from '../../schedules/entities/facility-availability.entity';
import { Facility } from '../../facilities/entities/facility.entity';
import { User } from '../../users/entities/users.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from 'typeorm';
import { FacilitySlot } from '../../schedules/entities/facility-slot.entity';
import { ReservationStatus } from '../enums/reservation-status.enum';
import { Payment } from '../../payment/entities/payment.entity';
import { DayOfWeek } from '../../schedules/enums/day-of-week.enum';

@Entity({ name: 'reservations' })
export class Reservation {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // ********************************************************************************

    @ManyToOne(() => User, (user) => user.reservations, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Facility, (fac) => fac.reservations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;

    @ManyToOne(() => FacilityAvailability, (fa) => fa.reservations, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'facility_availability_id' })
    availability: FacilityAvailability;

    @ManyToOne(() => FacilitySlot, (slot) => slot.reservations, { eager: false, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'facility_slot_id' })
    slot: FacilitySlot;

    @OneToMany(() => Payment, (p) => p.reservation)
    payments: Payment[];

    // *********************************************************************************

    @Column({ type: 'date' })
    date: string;

    @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
    dayOfWeek: DayOfWeek;

    @Column({ type: 'time', precision: 0, name: 'start_time' })
    startTime: string;

    @Column({ type: 'time', precision: 0, name: 'end_time' })
    endTime: string;

    @Column({ name: 'status', type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
    status: ReservationStatus;

    @Column({ name: 'price_cents', type: 'bigint' })
    priceCents: number;

    get price(): number {
        return typeof this.priceCents === 'string' ? parseInt(this.priceCents, 10) / 100 : this.priceCents / 100;
    }

    set price(value: number) {
        this.priceCents = Math.round(value * 100);
    }

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
