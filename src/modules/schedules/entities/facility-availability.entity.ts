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
import { DayOfWeek } from '../enums/day-of-week.enum';
import { FacilitySlot } from './facility-slot.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';

@Entity({ name: 'facility_availability' })
export class FacilityAvailability {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // ********************************************************

    @ManyToOne(() => Facility, (f) => f.availabilities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;

    @OneToMany(() => FacilitySlot, (fs) => fs.availability, { eager: true })
    slots: FacilitySlot[];

    @OneToMany(() => Reservation, (r) => r.availability)
    reservations?: Reservation[];

    // ********************************************************
    @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
    dayOfWeek: DayOfWeek;

    @Column({ name: 'start_time', type: 'time', precision: 0 })
    startTime: string;

    @Column({ name: 'end_time', type: 'time', precision: 0 })
    endTime: string;

    @Column({ name: 'slot_interval', type: 'interval' })
    slotInterval: string;

    @Column({ name: 'is_available', type: 'boolean', default: true })
    isAvailable: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
