import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './users.entity';
import { OwnerStatus } from '../../../shared/enums/owner-statuses.enum';
import { Facility } from '../../facilities/entities/facility.entity';

@Entity({ name: 'owners' })
export class Owner {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // ******

    @OneToOne(() => User, (user) => user.owner, { onDelete: 'CASCADE' }) // i used onDelete cascade because if the user was deleted the owner record must be deleted too
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => Facility, (f) => f.owner, { eager: true, onDelete: 'CASCADE' })
    facilities: Facility[];

    // ******

    @Column({ type: 'enum', enum: OwnerStatus, default: OwnerStatus.PENDING })
    status: OwnerStatus;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;
}
