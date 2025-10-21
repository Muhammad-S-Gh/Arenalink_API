import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PersonalAccessToken } from '../../auth/entities/personal-access-tokens.entity';
import { User } from '../../users/entities/users.entity';
import { Platform } from '../../../shared/enums/platform.enum';

@Entity({ name: 'user_fcm_tokens' })
export class UserFcmToken {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'text', name: 'fcm_token' })
    fcmToken: string;

    @Column({ type: 'enum', enum: Platform, nullable: true })
    platform: Platform | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;

    // ****************************************************************

    @OneToOne(() => PersonalAccessToken, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'token_id' })
    token: PersonalAccessToken;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
