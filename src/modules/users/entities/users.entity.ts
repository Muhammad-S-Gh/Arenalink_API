import { UserRole } from '../../../shared/enums/user-roles.enum';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Owner } from './owners.entity';
import { PasswordResetOtp } from '../../auth/entities/password-reset-otps.entity';
import { UserFcmToken } from '../../notifications/entities/user-fcm-tokens.entity';
import { Phone } from '../../phones/phones.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Notifications } from '../../../modules/notifications/entities/notifications.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'varchar', unique: true })
    email: string;

    @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
    emailVerifiedAt: Date | null;

    @Column({ type: 'varchar', nullable: true })
    password: string;

    @Column({ type: 'varchar', name: 'stripe_customer_id', nullable: true })
    stripeCustomerId: string;

    @Column({ type: 'varchar', name: 'first_name' })
    firstName: string;

    @Column({ type: 'varchar', name: 'last_name' })
    lastName: string;

    @Column({ type: 'varchar', nullable: true, name: 'profile_picture' })
    profilePicture: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude: number | null;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude: number | null;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Column({ type: 'varchar', nullable: true })
    location: string | null;

    @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
    verifiedAt: Date | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'confirmed_at' })
    confirmedAt: Date | null;

    @Column({ type: 'boolean', default: true })
    active: boolean;
    // ************************************************************ Invers side Relations to navigate back to relations
    // Without cascade, you’d have to explicitly call fcmTokenRepository.save(...) yourself for every FCM token before or after you save the user.

    @OneToOne(() => Owner, (owner) => owner.user, { cascade: true })
    owner: Owner;

    @OneToMany(() => UserFcmToken, (fcm) => fcm.user, { cascade: true })
    fcmToken: UserFcmToken[];

    @OneToMany(() => PasswordResetOtp, (otp) => otp.user, { cascade: true })
    passwordOtps: PasswordResetOtp[];

    @OneToOne(() => Phone, (phone) => phone.user, { cascade: true })
    phone: Phone;

    @OneToMany(() => Reservation, (res) => res.user, { eager: true })
    reservations: Reservation[];

    @OneToMany(() => Payment, (p) => p.user)
    payments: Payment[];

    @OneToMany(() => Favorite, (favorite) => favorite.user)
    favorites: Favorite[];

    @OneToMany(() => Notifications, (n) => n.user)
    notifications: Notifications[];
}
