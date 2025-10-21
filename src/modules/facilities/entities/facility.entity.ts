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
import { FacilityStatus } from '../enums/facility-status.enum';
import { Owner } from '../../users/entities/owners.entity';
import { Category } from '../../categories/entities/category.entity';
import { FacilityAttributeValue } from './facility-attribute-value.entity';
import { FacilityAvailability } from '../../schedules/entities/facility-availability.entity';
import { FacilityDayOff } from '../../schedules/entities/facility-days-off.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';

@Entity({ name: 'facilities' })
export class Facility {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // *******************************************************

    @ManyToOne(() => Owner, (owner) => owner.facilities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @ManyToOne(() => Category, (cat) => cat.facilities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    // ********************************************************

    @Column({ type: 'jsonb' })
    name: {
        en: string;
        ar: string;
    };

    @Column('jsonb')
    description: {
        en: string;
        ar: string;
    };

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    lat: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    lng: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    pricePerHour: number;

    @Column({ type: 'jsonb', default: [] })
    images: string[];

    @Column({ type: 'enum', enum: FacilityStatus, default: FacilityStatus.INACTIVE })
    status: FacilityStatus;

    // ********************************************************

    @OneToMany(() => FacilityAttributeValue, (val) => val.facility, { cascade: true, eager: true })
    attributeValues: FacilityAttributeValue[];

    @OneToMany(() => FacilityAvailability, (fa) => fa.facility, { cascade: true })
    availabilities: FacilityAvailability[];

    @OneToMany(() => FacilityDayOff, (fdo) => fdo.facility, { cascade: true })
    daysOff: FacilityDayOff[];

    @OneToMany(() => Reservation, (res) => res.facility)
    reservations: Reservation[];

    @OneToMany(() => Payment, (p) => p.facility)
    payments: Payment[];

    @OneToMany(() => Favorite, (favorite) => favorite.facility)
    favorites: Favorite[];

    // ********************************************************
    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;
}
