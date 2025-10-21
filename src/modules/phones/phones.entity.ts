import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/entities/users.entity';

@Entity({ name: 'phones' })
export class Phone {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'varchar', name: 'phone_number', nullable: true })
    phoneNumber: string;

    @Column({ type: 'varchar', name: 'phone_number_otp_code', nullable: true })
    phoneNumberOtpCode: string | null;

    @Column({ type: 'timestamp', name: 'phone_number_otp_expired_date', nullable: true })
    phoneNumberOtpExpiredDate: Date | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;

    // ********************************

    @OneToOne(() => User, (user) => user.phone, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
