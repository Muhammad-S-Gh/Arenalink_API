import { Reservation } from '../../reservations/entities/reservation.entity';
import { Facility } from '../../facilities/entities/facility.entity';
import { User } from '../../users/entities/users.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity({ name: 'payments' })
export class Payment {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // **********************************************************
    @ManyToOne(() => User, (user) => user.payments, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Facility, (f) => f.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;

    @ManyToOne(() => Reservation, (r) => r.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reservation_id' })
    reservation: Reservation;

    // *************************************************************
    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    date: string;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ name: 'stripe_client_secret', type: 'text', nullable: true })
    stripeClientSecret?: string;

    @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
    stripePaymentIntentId?: string;

    @Column({ name: 'stripe_webhook_payload', type: 'jsonb', nullable: true })
    stripeWebhookPayload?: any;

    @Column({ type: 'varchar', name: 'stripe_refund_id', nullable: true })
    stripeRefundId?: string;

    @Column({ type: 'jsonb', nullable: true })
    description?: {
        ar?: string;
        en?: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    title?: {
        ar?: string;
        en?: string;
    };

    @Column({ name: 'amount_cents', type: 'bigint' })
    amountCents: number;
    get amount(): number {
        return typeof this.amountCents === 'string' ? parseInt(this.amountCents, 10) / 100 : this.amountCents / 100;
    }

    set amount(value: number) {
        this.amountCents = Math.round(value * 100);
    }
    @Column({ type: 'varchar' })
    currency: string;

    @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
    completedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
