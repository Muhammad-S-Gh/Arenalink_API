import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';

@Entity({ name: 'password_reset_otps' })
export class PasswordResetOtp {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'varchar', name: 'otp_code' })
    otpCode: string;

    @Column({ type: 'timestamp', name: 'expires_at' })
    expiresAt: Date;

    @Column({ type: 'timestamp', name: 'verified_at', nullable: true })
    verifiedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    // ********************************

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
