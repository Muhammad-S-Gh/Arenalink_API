import { User } from '../../../modules/users/entities/users.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    JoinColumn,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notifications' })
export class Notifications {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'varchar' })
    type: string;

    @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'jsonb', nullable: true })
    title?: {
        ar?: string;
        en?: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    body?: {
        ar?: string;
        en?: string;
    };

    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    readAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
