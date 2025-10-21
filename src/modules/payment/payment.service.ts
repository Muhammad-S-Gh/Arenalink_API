import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { User } from '../users/entities/users.entity';
import { ReservationsService } from '../reservations/reservations.service';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { ReservationStatus } from '../reservations/enums/reservation-status.enum';
import { ConfigService } from '@nestjs/config';
import { Reservation } from '../reservations/entities/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { DataSource, DeepPartial, IsNull, LessThan, Repository } from 'typeorm';
import { PaymentStatus } from './enums/payment-status.enum';
import Stripe from 'stripe';
import { PaymentController } from './payment.controller';
import { UsersService } from '../users/users.service';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer-core';
import PdfPrinter from 'pdfmake';
const PDFDocument = require('pdfkit');
import { join } from 'path';
import { existsSync } from 'fs';
import { Writable } from 'stream';
import { Facility } from '../facilities/entities/facility.entity';
import { AttributeType } from '../categories/enums/attributeType.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Getfacilities } from '../facilities/services/getfacilities.service';
import { UserRole } from '../../shared/enums/user-roles.enum';

@Injectable()
export class PaymentService {
    private stripe: Stripe;
    private readonly logger = new Logger(PaymentService.name);
    private webhookSecret: string;
    private templateHtml: string | null = null;

    constructor(
        @InjectRepository(Payment)
        private paymentRepo: Repository<Payment>,
        @Inject(forwardRef(() => ReservationsService))
        private readonly reservationService: ReservationsService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
        private readonly i18n: YcI18nService,
        private readonly dataSource: DataSource,
        private readonly facilityService: Getfacilities,
    ) {
        this.stripe = new Stripe(configService.getOrThrow('STRIPE_SECRET_KEY'), {
            apiVersion: '2025-07-30.basil',
        });
        this.webhookSecret = configService.getOrThrow('STRIPE_WEBHOOK_SECRET');

        const tplPath = path.join(process.cwd(), 'src', 'modules', 'payment', 'templates', 'invoice.hbs');
        try {
            this.templateHtml = fs.readFileSync(tplPath, 'utf8');
        } catch (err) {
            this.logger.error('Invoice template not found: ' + tplPath, err);
            this.templateHtml = null;
        }
    }

    async findFacilityPayments(facilityId: number, user: User) {
        const lang = this.i18n.lang();
        const facility = await this.facilityService.getFacility(facilityId, user);
        if (!facility) throw new BadRequestException(this.i18n.t('errors.facilityNotFound'));

        const payments = await this.paymentRepo.find({
            where: {
                facility: { id: facilityId },
            },
            relations: ['facility', 'reservation'],
            order: { completedAt: 'DESC' },
        });

        return payments.map((p) => ({
            id: p.id,
            status: p.status,
            amount: p.amount,
            completedAt: p.completedAt ?? null,
            currency: p.currency ?? null,
            date: p.date ?? null,
            title: lang === 'ar' ? (p.title?.ar ?? null) : (p.title?.en ?? null),
            description: lang === 'ar' ? (p.description?.ar ?? null) : (p.description?.en ?? null),
            stripePaymentIntentId: p.stripePaymentIntentId ?? null,
            stripeClientSecret: p.stripeClientSecret ?? null,
            stripeRefundId: p.stripeRefundId ?? null,
            facilityId: p.facility?.id ?? null,
            reservationId: p.reservation?.id ?? null,
        }));
    }

    async findPaymentById(id: number): Promise<Payment> {
        const newPayment = await this.paymentRepo.findOne({
            where: { id },
            relations: ['reservation', 'user', 'facility'],
        });

        if (!newPayment) throw new BadRequestException(this.i18n.t('payment.paymentNotFound'));
        return newPayment;
    }

    // *****************************

    async createPaymentIntent(reservationId: number, user: User) {
        const reservation = await this.reservationService.findReservationWithRelations(reservationId);

        if (!reservation || reservation.status !== ReservationStatus.READY) {
            throw new BadRequestException(this.i18n.t('reservations.reservationNotFound'));
        }

        if (!this.configService.get('STRIPE_SECRET_KEY')) {
            this.logger.error('STRIPE_SECRET_KEY missing from config');
            throw new InternalServerErrorException('STRIPE_SECRET_KEY is incorrect or not found');
        }

        if (!reservation.facility || !reservation.facility.id) {
            this.logger.error(`Reservation ${reservationId} missing facility relation`);
            throw new BadRequestException(this.i18n.t('reservations.reservationNotFound'));
        }

        const amountCents = Number(reservation.priceCents);
        if (!Number.isFinite(amountCents) || amountCents <= 0) {
            this.logger.error(
                `Invalid reservation.priceCents for reservation ${reservationId}: ${reservation.priceCents}`,
            );
            throw new BadRequestException('Invalid amount in cents in the reservation');
        }

        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await this.stripe.customers.create({
                email: user.email ?? undefined,
                name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined,
            });
            await this.usersService.update(user.id, {
                stripeCustomerId: customer.id,
            });
            stripeCustomerId = customer.id;
        }

        const existingCanceledPayment = await this.paymentRepo.findOne({
            where: {
                reservation: { id: reservation.id },
                status: PaymentStatus.DECLINED,
            },
        });

        if (existingCanceledPayment) {
            throw new BadRequestException('This reservation has been canceled. Please create a new reservation.');
        }

        const idempotencyKey = `payment_intent:reservation_${reservation.id}_${user.id}`;
        let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;
        try {
            paymentIntent = await this.stripe.paymentIntents.create(
                {
                    amount: Number(reservation.priceCents),
                    currency: this.configService.getOrThrow('STRIPE_CURRENCY'),
                    payment_method_types: ['card'],
                    customer: stripeCustomerId,
                    metadata: {
                        reservation_id: String(reservation.id),
                        user_id: String(user.id),
                        payment_type: 'Reservation',
                        facility_id: String(reservation.facility.id),
                    },
                    receipt_email: user.email,
                },
                { idempotencyKey },
            );
        } catch (err: any) {
            this.logger.error('createPaymentIntent error', err);
            if (err && err.type && err.message) {
                throw new BadRequestException(this.i18n.t('payment.stripeError', { msg: err.message }));
            }
            throw new InternalServerErrorException(this.i18n.t('payment.unexpectedError'));
        }

        try {
            const res = await this.dataSource.transaction(async (manager) => {
                const isoDate = reservation.date;
                const dateInt = parseInt(String(isoDate).replace(/-/g, ''), 10);
                const slotId = reservation.slot?.id ?? null;
                const lockKey1 = slotId ?? reservation.facility.id;
                const lockKey2 = dateInt;

                await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [lockKey1, lockKey2]);

                const existingByIntent = await manager.getRepository(Payment).findOne({
                    where: { stripePaymentIntentId: paymentIntent.id },
                    relations: ['reservation'],
                });

                if (existingByIntent) {
                    return {
                        clientSecret: paymentIntent.client_secret,
                        paymentIntentId: paymentIntent.id,
                        paymentId: existingByIntent.id,
                    };
                }

                const existingPendingForReservation = await manager.getRepository(Payment).findOne({
                    where: { reservation: { id: reservation.id }, status: PaymentStatus.PENDING } as any,
                });
                if (existingPendingForReservation) {
                    return {
                        clientSecret: existingPendingForReservation.stripeClientSecret,
                        paymentIntentId: existingPendingForReservation.stripePaymentIntentId,
                        paymentId: existingPendingForReservation.id,
                    };
                }

                const confirmedCount = slotId
                    ? await manager.getRepository(Reservation).count({
                          where: {
                              slot: { id: slotId },
                              date: isoDate,
                              status: ReservationStatus.CONFIRMED,
                          },
                      })
                    : 0;

                const pendingPaymentCount = await manager.getRepository(Payment).count({
                    where: {
                        reservation: { slot: slotId ? { id: slotId } : IsNull(), date: isoDate },
                        status: PaymentStatus.PENDING,
                    } as any,
                });

                const legacyCount = await this.reservationService.countLegacyOverlappingReservations(
                    reservation.facility.id,
                    isoDate,
                    reservation.startTime,
                    reservation.endTime,
                    manager,
                );

                const facility = await manager.getRepository(Facility).findOne({
                    where: { id: reservation.facility.id },
                    relations: [
                        'attributeValues',
                        'attributeValues.categoryAttribute',
                        'category',
                        'category.attributes',
                    ],
                });
                if (!facility) throw new BadRequestException(this.i18n.t('errors.facilityNotFound'));

                let capacity: any = null;
                const facilityAttrs = facility.category?.attributes ?? [];
                for (const attr of facilityAttrs) {
                    if (attr.name?.en?.toLowerCase() === 'capacity' && attr.type === AttributeType.NUMBER) {
                        const attrId = attr.id;
                        const found = (facility.attributeValues ?? []).find((v) => v.categoryAttribute?.id === attrId);
                        if (found) capacity = found.value;
                        break;
                    }
                }
                let effectiveCapacity = 1;
                if (capacity !== null && capacity !== undefined) {
                    const num = typeof capacity === 'number' ? capacity : parseInt(String(capacity), 10);
                    effectiveCapacity = Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
                }

                const used = confirmedCount + pendingPaymentCount + legacyCount;
                if (used >= effectiveCapacity) {
                    await manager.getRepository(Reservation).update(reservation.id, {
                        status: ReservationStatus.DECLINED,
                    });
                    return { capacityExceeded: true, message: this.i18n.t('payment.capacityExceeded') };
                }

                const paymentRepo = manager.getRepository(Payment);
                const paymentPayload: DeepPartial<Payment> = {
                    user: { id: user.id } as any,
                    reservation: { id: reservation.id } as any,
                    stripeClientSecret: String(paymentIntent.client_secret),
                    status: PaymentStatus.PENDING,
                    amountCents,
                    currency: paymentIntent.currency ?? this.configService.getOrThrow('STRIPE_CURRENCY'),
                    stripePaymentIntentId: paymentIntent.id,
                    facility: { id: reservation.facility.id } as any,
                    title: {
                        en: `Invoice for reservation ${reservation.id}`,
                        ar: `فاتورة للحجز رقم ${reservation.id}`,
                    },
                    description: {
                        en: `Payment due for reservation ${reservation.id} totaling ${reservation.price} fo  Mr/Ms's. ${user.firstName} ${user.lastName} at ${new Date()} for facility ${facility.name.en}`,
                        ar: `المبلغ المستحق للطلب رقم ${reservation.id} بمجموع ${reservation.price} للمستخدم السيد/السيدة ${user.firstName} ${user.lastName}  بتاريخ  ${new Date()} for facility ${facility.name.ar}`,
                    },
                };

                const paymentEntity = paymentRepo.create(paymentPayload);
                const savedPayment = await paymentRepo.save(paymentEntity);

                return {
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id,
                    paymentId: savedPayment.id,
                };
            });

            if (res && (res as any).capacityExceeded) {
                try {
                    if (paymentIntent && paymentIntent.id) {
                        const pi = await this.stripe.paymentIntents.retrieve(paymentIntent.id);
                        if (!pi || pi.status !== 'succeeded') {
                            await this.stripe.paymentIntents.cancel(paymentIntent.id);
                            this.logger.log(`Cancelled PI ${paymentIntent.id} after capacity check`);
                        } else {
                            this.logger.log(`PI ${paymentIntent.id} already succeeded; not canceling`);
                        }
                    }
                } catch (stripeErr) {
                    this.logger.warn('Failed to cancel PaymentIntent after transaction', stripeErr);
                }
                throw new BadRequestException(this.i18n.t('payment.MayCapacityExceeded'));
            }
            return res;
        } catch (err) {
            try {
                if (paymentIntent && paymentIntent.id) {
                }
            } catch (cancelErr) {
                this.logger.warn('Failed to cancel rejected PaymentIntent', cancelErr);
            }
            throw err;
        }
    }

    async handleWebhook(req: Request) {
        const raw = (req as any).body;
        const sig = req.headers['stripe-signature'] as string;
        if (!this.webhookSecret) {
            this.logger.warn('STRIPE_WEBHOOK_SECRET is not configured. Attempting to parse without verification.');
        }

        try {
            const event = this.webhookSecret
                ? this.stripe.webhooks.constructEvent(raw, sig, this.webhookSecret)
                : typeof raw === 'string'
                  ? JSON.parse(raw)
                  : raw;

            this.logger.log(`Stripe webhook received: ${event.type}`);

            if (event.type === 'payment_intent.succeeded') {
                const pi = event.data.object as Stripe.PaymentIntent;
                const amount = Number(pi.amount);
                const clientSecret = pi.client_secret;
                const currency = pi.currency.toLowerCase();
                const intentId = pi.id;

                this.logger.debug(`PI succeeded: id=${intentId} amount=${amount} currency=${currency}`);

                if (!clientSecret || !intentId) {
                    this.logger.warn('Missing client_secret or intent id, cannot match payment');
                    throw new BadRequestException('client secret was not found.');
                }

                const payment = await this.paymentRepo.findOne({
                    where: [{ stripeClientSecret: clientSecret }, { stripePaymentIntentId: intentId }],
                    relations: ['reservation'],
                });

                if (!payment) {
                    this.logger.warn(`Payment not found for client_secret=${clientSecret} or intent=${intentId}`);
                    return { message: 'no payment found' };
                }

                const expectedCents = Number(payment.reservation.priceCents);
                const paymentCurrency = payment.currency.toLowerCase();

                if (amount !== expectedCents || currency.toLowerCase() !== paymentCurrency) {
                    this.logger.warn(
                        `Discrepancy for intent ${intentId}: received ${amount} ${currency} expected ${expectedCents} ${paymentCurrency}`,
                    );

                    throw new BadRequestException(`Discrepancy for intent ${clientSecret}`);
                }

                // *******

                await this.dataSource.transaction(async (manager) => {
                    const reservation = await manager.getRepository(Reservation).findOne({
                        where: { id: payment.reservation.id },
                        relations: ['slot', 'facility'],
                    });

                    if (!reservation) {
                        await manager.getRepository(Payment).update(payment.id, {
                            stripeWebhookPayload: event,
                            status: PaymentStatus.DECLINED,
                            completedAt: new Date(),
                        });
                        return { message: this.i18n.t('payment.paymentNotHandled') };
                    }

                    if (
                        payment.status === PaymentStatus.COMPLETED &&
                        reservation.status === ReservationStatus.CONFIRMED
                    ) {
                        this.logger.log(`Webhook replay: payment ${payment.id} already completed`);
                        return { message: this.i18n.t('payment.alreadyProcessed') };
                    }
                    if (payment.status === PaymentStatus.DECLINED) {
                        this.logger.warn(`Payment ${payment.id} was previously declined`);
                        return { message: this.i18n.t('payment.alreadyDeclined') };
                    }

                    const isoDate = reservation.date;
                    const dateInt = parseInt(isoDate.replace(/-/g, ''), 10);

                    const slotId = reservation.slot?.id ?? null;
                    const lockKey1 = slotId ?? reservation.facility.id;
                    const lockKey2 = dateInt;

                    await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [lockKey1, lockKey2]);

                    const confirmedCount = slotId
                        ? await manager.getRepository(Reservation).count({
                              where: {
                                  slot: { id: slotId },
                                  date: isoDate,
                                  status: ReservationStatus.CONFIRMED,
                              },
                          })
                        : 0;

                    const newStart = reservation.startTime;
                    const newEnd = reservation.endTime;

                    const legacyCount = await this.reservationService.countLegacyOverlappingReservations(
                        reservation.facility.id,
                        isoDate,
                        newStart,
                        newEnd,
                        manager,
                    );

                    const facility = await manager.getRepository(Facility).findOne({
                        where: { id: reservation.facility.id },
                        relations: [
                            'attributeValues',
                            'attributeValues.categoryAttribute',
                            'category',
                            'category.attributes',
                        ],
                    });

                    if (!facility) {
                        throw new BadRequestException(this.i18n.t('errors.facilityNotFound'));
                    }

                    let capacity: any = null;
                    const facilityAttrs = facility.category?.attributes ?? [];

                    for (const attr of facilityAttrs) {
                        if (attr.name?.en?.toLowerCase() === 'capacity' && attr.type === AttributeType.NUMBER) {
                            const attrId = attr.id;
                            const found = (facility.attributeValues ?? []).find(
                                (v) => v.categoryAttribute?.id === attrId,
                            );
                            if (found) capacity = found.value;
                            break;
                        }
                    }

                    let effectiveCapacity: number;
                    if (capacity === null || capacity === undefined) {
                        effectiveCapacity = 1;
                    } else {
                        const num = typeof capacity === 'number' ? capacity : parseInt(String(capacity), 10);
                        effectiveCapacity = Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
                    }

                    if (confirmedCount + legacyCount + 1 > effectiveCapacity) {
                        await manager.getRepository(Payment).update(payment.id, {
                            status: PaymentStatus.DECLINED,
                            completedAt: new Date(),
                            stripePaymentIntentId: intentId,
                            stripeWebhookPayload: event,
                        });

                        await manager.getRepository(Reservation).update(reservation.id, {
                            status: ReservationStatus.DECLINED,
                        });

                        return { message: this.i18n.t('payment.capacityExceeded') };
                    }

                    await manager.getRepository(Payment).update(payment.id, {
                        status: PaymentStatus.COMPLETED,
                        completedAt: new Date(),
                        stripePaymentIntentId: intentId,
                        stripeWebhookPayload: event,
                    });

                    await manager.getRepository(Reservation).update(payment.reservation.id, {
                        status: ReservationStatus.CONFIRMED,
                    });
                });
                this.logger.log(`Payment ${payment.id} completed, reservation ${payment.reservation.id} confirmed`);
                return { message: this.i18n.t('payment.paymentCompleted') };
            }
            this.logger.log(`Unhandled Stripe event type: ${event.type}`);
            return { message: 'event not handled' };
        } catch (err: any) {
            this.logger.warn('Webhook handling error: ' + (err?.message || err));
            if (err?.type === 'StripeSignatureVerificationError') {
                throw new BadRequestException('Invalid webhook signature');
            }
            throw new InternalServerErrorException('payment internal error');
        }
    }

    async cancelPaymentIntent(paymentIntentId: string) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status === 'canceled') {
                return { canceled: false, reason: 'already_canceled' };
            }

            if (paymentIntent.status === 'succeeded') {
                return { canceled: false, reason: 'already_succeeded' };
            }

            await this.stripe.paymentIntents.cancel(paymentIntentId);
            return { canceled: true };
        } catch (error) {
            this.logger.error(`cancelPaymentIntent error for ${paymentIntentId}`, error);
            throw new InternalServerErrorException('Failed to cancel payment intent');
        }
    }

    //

    //

    //

    async ownerRefundPayment(paymentIntentId: string, ownerUser: User) {
        return await this.dataSource.transaction(async (manager) => {
            const payment = await manager.getRepository(Payment).findOne({
                where: { stripePaymentIntentId: paymentIntentId },
                relations: ['reservation', 'facility', 'facility.owner', 'reservation.user'],
            });

            if (!payment) throw new NotFoundException('Payment not found');

            if (payment.status !== PaymentStatus.COMPLETED) {
                throw new BadRequestException('Only completed payments can be refunded');
            }

            const isOwner = ownerUser.role === UserRole.OWNER;
            const ownsFacility = !!(
                payment.facility &&
                payment.facility.owner &&
                payment.facility.owner.user &&
                Number(payment.facility.owner.user.id) === Number(ownerUser.id)
            );

            if (!isOwner && !ownsFacility) {
                throw new ForbiddenException('You are not allowed to refund this payment');
            }

            const pi = (await this.stripe.paymentIntents.retrieve(paymentIntentId, {
                expand: ['charges.data'],
            })) as Stripe.Response<Stripe.PaymentIntent & { charges?: Stripe.ApiList<Stripe.Charge> }>;

            if (pi.status !== 'succeeded') {
                throw new BadRequestException('PaymentIntent is not in succeeded state and cannot be refunded');
            }

            const charges = (pi.charges && (pi.charges as Stripe.ApiList<Stripe.Charge>).data) || [];
            const chargeId = charges.length ? charges[0].id : (pi as any).latest_charge;

            if (!chargeId) {
                throw new BadRequestException('No charge found to refund for this payment');
            }

            const refund = await this.stripe.refunds.create({
                charge: chargeId,
                metadata: {
                    paymentId: String(payment.id),
                    reservationId: payment.reservation ? String(payment.reservation.id) : '',
                },
            });

            await manager.getRepository(Payment).update(payment.id, {
                status: PaymentStatus.REFUNDED,
                stripeRefundId: refund.id,
                completedAt: new Date(),
            });

            if (payment.reservation && payment.reservation.id) {
                await manager.getRepository(Reservation).update(payment.reservation.id, {
                    status: ReservationStatus.DECLINED,
                });
            }

            return { refundId: refund.id };
        });
    }

    //

    //

    //

    async userRefundPayment(paymentIntentId: string, user: User) {
        if (!paymentIntentId) throw new BadRequestException('paymentIntentId is required');

        const payment = await this.paymentRepo.findOne({
            where: { stripePaymentIntentId: paymentIntentId },
            relations: ['reservation', 'reservation.user', 'user'],
        });

        if (!payment) throw new NotFoundException('Payment not found');

        const ownerId = payment.user?.id ?? payment.reservation?.user?.id;
        if (!ownerId || String(ownerId) !== String(user.id)) {
            throw new ForbiddenException('You are not allowed to refund this payment');
        }

        if (payment.status !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Only completed payments can be refunded');
        }

        const paidAt = payment.completedAt ?? payment.createdAt ?? payment.date;
        if (!paidAt) {
            throw new BadRequestException('Payment timestamp unavailable');
        }

        const paidTime = new Date(paidAt).getTime();
        const now = Date.now();
        const ms24h = 24 * 60 * 60 * 1000;
        if (now - paidTime > ms24h) {
            throw new BadRequestException('Refund window (24 hours) has expired');
        }

        if (!this.stripe) {
            throw new InternalServerErrorException('Stripe not configured on server');
        }

        const amountCents = payment.amountCents;
        const amount = payment.amount;

        if (!amountCents) {
            throw new InternalServerErrorException('Unable to determine amount to refund');
        }

        try {
            const stripeRefund = await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amountCents,
                metadata: { internalPaymentId: String(payment.id), refundedBy: String(user.id) },
            });

            payment.status = PaymentStatus.REFUNDED;
            payment.stripeRefundId = stripeRefund.id;

            await this.paymentRepo.save(payment);
            await this.reservationService.update(payment.reservation.id, {
                status: ReservationStatus.DECLINED,
            });

            return {
                success: true,
                refundId: stripeRefund.id,
                refundedAmountCents: stripeRefund.amount,
                refundedAmountDollars: amount,
                currency: stripeRefund.currency,
            };
        } catch (err: any) {
            const message = err?.message ?? 'Stripe refund failed';
            this.logger?.error('Stripe refund failed', err);
            throw new InternalServerErrorException(message);
        }
    }

    //

    //

    //
    @Cron(CronExpression.EVERY_10_MINUTES)
    async cleanupExpiredPendingPayments() {
        const ttlMinutes = 5;
        const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

        console.log(`Starting cleanup of PENDING payments older than ${ttlMinutes} minutes...`);

        const expiredPayments = await this.dataSource.getRepository(Payment).find({
            where: {
                status: PaymentStatus.PENDING,
                createdAt: LessThan(cutoff),
            },
            relations: ['reservation'],
        });

        if (expiredPayments.length === 0) {
            console.log('No expired pending payments to clean.');
            return;
        }

        console.log(`Found ${expiredPayments.length} expired pending payments. Cleaning up...`);

        for (const payment of expiredPayments) {
            try {
                if (payment.stripePaymentIntentId) {
                    await this.cancelPaymentIntent(payment.stripePaymentIntentId);
                }

                await this.dataSource.getRepository(Payment).update(payment.id, {
                    status: PaymentStatus.DECLINED,
                    completedAt: new Date(),
                });

                await this.reservationService.markReservationExpired(payment.reservation.id);

                console.log(`Canceled and expired payment ${payment.id}`);
            } catch (err) {
                console.error(`Failed to clean payment ${payment.id}:`, err);
            }
        }
    }

    async generateInvoicePdf(paymentId: number) {
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId },
            relations: ['reservation', 'facility', 'user'],
        });

        if (!payment) throw new NotFoundException(this.i18n.t('payment.paymentNotFound'));
        if (payment.status !== PaymentStatus.COMPLETED)
            throw new BadRequestException(this.i18n.t('payment.paymentNotCompleted'));

        const lang = this.i18n.lang() ? this.i18n.lang() : 'en';
        const isRTL = lang === 'ar' ? true : false;

        const paymentTitle = lang === 'ar' ? payment.title?.ar : payment.title?.en;
        const paymentDesc = lang === 'ar' ? payment.description?.ar : payment.description?.en;

        const formattedDate = new Intl.DateTimeFormat(lang, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(payment.createdAt));

        const formatterNumber = new Intl.NumberFormat(lang, {
            style: 'currency',
            currency: payment.currency || 'USD',
            minimumFractionDigits: 2,
        });

        const amountFormatted = formatterNumber.format(payment.amount);
        const facilityName = lang === 'ar' ? payment.facility?.name.ar : payment.facility?.name.en;

        const tplData = {
            companyName: process.env.COMPANY_NAME || 'Arenalink',
            companyAddress: process.env.COMPANY_ADDRESS || 'Damascus, Syria',
            companyPhone: process.env.COMPANY_PHONE || '',
            companyEmail: process.env.COMPANY_EMAIL || '',
            paymentId: payment.id,
            date: formattedDate,
            userName: `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim(),
            userEmail: payment.user?.email,
            facilityName,
            titleLocalized: paymentTitle,
            descriptionLocalized: paymentDesc,
            lineDescription: paymentTitle,
            amount: amountFormatted,
            rawAmount: payment.amount,
            currency: payment.currency,
            isRTL,
            lang,
        };

        const source = this.templateHtml;
        const template = handlebars.compile(source);
        const html = template(tplData);

        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
        const browser = await puppeteer.launch({
            executablePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true,
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' },
            });
            return pdfBuffer;
        } finally {
            await browser.close();
        }
    }
}
