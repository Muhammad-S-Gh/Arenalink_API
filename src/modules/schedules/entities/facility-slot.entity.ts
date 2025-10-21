import { Facility } from '../../facilities/entities/facility.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { FacilityAvailability } from './facility-availability.entity';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { Reservation } from '../../reservations/entities/reservation.entity';

@Entity({ name: 'facility_slots' })
export class FacilitySlot {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // **************************************************

    @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;

    @ManyToOne(() => FacilityAvailability, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_availability_id' })
    availability: FacilityAvailability;

    @OneToMany(() => Reservation, (r) => r.slot, { nullable: true })
    reservations?: Reservation;

    // *************************************************

    @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
    dayOfWeek: DayOfWeek;

    @Column({ name: 'slot_price', type: 'numeric', precision: 10, scale: 2 })
    slotPrice: number;

    @Column({ name: 'slot_price_cents', type: 'bigint' })
    slotPriceCents: number;

    @Column({ name: 'start_time', type: 'time', precision: 0 })
    startTime: string;

    @Column({ name: 'end_time', type: 'time', precision: 0 })
    endTime: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
