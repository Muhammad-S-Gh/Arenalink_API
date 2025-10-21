import { Facility } from '../../facilities/entities/facility.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { DayOfWeek } from '../enums/day-of-week.enum';

@Entity({ name: 'facility_days_off' })
export class FacilityDayOff {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // *******************************************************

    @ManyToOne(() => Facility, (f) => f.daysOff, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;

    // *******************************************************

    @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
    dayOfWeek: DayOfWeek;

    @Column({ name: 'date', type: 'date', nullable: true })
    date: Date | null;

    @Column({ name: 'reason', nullable: true })
    reason?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
