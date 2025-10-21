import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    DeepPartial,
    EntityManager,
    In,
    IsNull,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    Not,
    Repository,
} from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Getfacilities } from '../facilities/services/getfacilities.service';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { SchedulesService } from '../schedules/schedules.service';
import { ReservationStatus } from './enums/reservation-status.enum';
import { User } from '../users/entities/users.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FacilityStatus } from '../facilities/enums/facility-status.enum';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { AttributeType } from '../categories/enums/attributeType.enum';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { CreateReservationResultDto } from './dtos/create-reservation-response.dto';
import {
    GetApprovedReservationsResponseDto,
    OwnerApprovedReservationDto,
} from '../schedules/dtos/owner-approved-reservations.dto';
import { GetMyInvoicesResponseDto, UserInvoiceDto } from '../users/dtos/user-invoice.dto';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class ReservationsService {
    private readonly logger = new Logger(ReservationsService.name);

    constructor(
        @InjectRepository(Reservation)
        private readonly reservationRepo: Repository<Reservation>,
        private readonly schedulesService: SchedulesService,
        private readonly facilityService: Getfacilities,
        private readonly i18n: YcI18nService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => PaymentService))
        private readonly paymentService: PaymentService,
    ) {}

    async getBlockedSlots(facilityId: number) {
        const blockedSlots = await this.reservationRepo.find({
            where: {
                status: ReservationStatus.BLOCKED,
                facility: { id: facilityId },
            },
            relations: ['slot'],
        });
        return blockedSlots;
    }

    async unblockSlot(blockId: number, user: User) {
        const reservation = await this.reservationRepo.findOne({
            where: {
                id: blockId,
            },
            relations: ['user'],
        });

        if (!reservation) {
            throw new BadRequestException('Blocked slot is not found');
        }

        if (user.id !== reservation.user.id) {
            throw new BadRequestException('Blocked slot is not found');
        }
        await this.reservationRepo.delete({ id: blockId });
    }

    async countDateConfirmedReservations(slotId: number, isoDate: string) {
        const confirmedCount = await this.reservationRepo.count({
            where: {
                slot: { id: slotId },
                date: isoDate,
                status: ReservationStatus.CONFIRMED,
            },
        });
        return confirmedCount;
    }

    async findFacilityLegaceReservations(facilityId: number) {
        const legacyReservations = await this.reservationRepo.find({
            where: {
                facility: { id: facilityId },
                availability: IsNull(),
                slot: IsNull(),
                status: ReservationStatus.CONFIRMED,
            },
        });

        return legacyReservations;
    }

    async markReservationExpired(reservationId: number) {
        await this.reservationRepo.update(
            { id: reservationId, status: ReservationStatus.READY },
            { status: ReservationStatus.DECLINED },
        );
    }

    async findReservationById(reservationId: number) {
        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId }, relations: ['slot'] });
        return reservation;
    }

    async countLegacyOverlappingReservations(
        facilityId: number,
        date: string,
        newStart: string,
        newEnd: string,
        manager?: EntityManager,
    ): Promise<number> {
        const repo = manager ? manager.getRepository(Reservation) : this.reservationRepo;

        const qb = repo
            .createQueryBuilder('r')
            // filter by facility
            .where('r.facility_id = :facilityId', { facilityId })
            // legacy reservations are those that lost availability/slot (both null)
            .andWhere('r.facility_availability_id IS NULL')
            .andWhere('r.facility_slot_id IS NULL')
            // exact date (stored as date string in DB)
            .andWhere('r.date = :date', { date })
            // only confirmed legacy reservations count toward blocking/occupancy
            .andWhere('r.status = :status', { status: ReservationStatus.CONFIRMED })
            // overlap check: new interval overlaps existing if newStart < existing.end AND newEnd > existing.start
            .andWhere('(:newStart < r.end_time AND :newEnd > r.start_time)', {
                newStart,
                newEnd,
            });

        const count = await qb.getCount();
        return count;
    }

    async getApprovedReservations(facilityId: number): Promise<GetApprovedReservationsResponseDto> {
        const lang = this.i18n.lang();
        const rows = await this.reservationRepo.find({
            where: {
                facility: { id: facilityId },
                status: ReservationStatus.CONFIRMED,
            },
            relations: ['facility', 'availability', 'slot', 'user'],
            order: { date: 'DESC', startTime: 'ASC' },
        });

        const reservations: OwnerApprovedReservationDto[] = rows.map((r) => ({
            id: r.id,
            userId: r.user?.id,
            userName: `${r.user.firstName} ${r.user.lastName}`,
            date: r.date,
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
            status: r.status,
            price: r.price,
            facility: {
                id: r.facility.id,
                name: lang === 'ar' ? r.facility.name.ar : r.facility.name.en,
            },
            availabilityId: r.availability ? Number(r.availability.id) : null,
            slotId: r.slot ? Number(r.slot.id) : null,
        }));

        return { reservations };
    }

    async getOwnerReservations(facilityId: number): Promise<GetApprovedReservationsResponseDto> {
        const lang = this.i18n.lang();
        const rows = await this.reservationRepo.find({
            where: {
                facility: { id: facilityId },
            },
            relations: ['facility', 'availability', 'slot', 'user'],
            order: { date: 'DESC', startTime: 'ASC' },
        });

        const reservations: OwnerApprovedReservationDto[] = rows.map((r) => ({
            id: r.id,
            userId: r.user?.id,
            userName: `${r.user.firstName} ${r.user.lastName}`,
            date: r.date,
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
            status: r.status,
            price: r.price,
            facility: {
                id: r.facility.id,
                name: lang === 'ar' ? r.facility.name.ar : r.facility.name.en,
            },
            availabilityId: r.availability ? Number(r.availability.id) : null,
            slotId: r.slot ? Number(r.slot.id) : null,
        }));

        return { reservations };
    }

    async getPendingReservations(facilityId: number): Promise<GetApprovedReservationsResponseDto> {
        const lang = this.i18n.lang();
        const rows = await this.reservationRepo.find({
            where: {
                facility: { id: facilityId },
                status: ReservationStatus.PENDING,
            },
            relations: ['facility', 'availability', 'slot', 'user'],
            order: { date: 'DESC', startTime: 'ASC' },
        });

        const reservations: OwnerApprovedReservationDto[] = rows.map((r) => ({
            id: r.id,
            userId: r.user?.id,
            userName: `${r.user.firstName} ${r.user.lastName}`,
            date: r.date,
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
            status: r.status,
            price: r.price,
            facility: {
                id: r.facility.id,
                name: lang === 'ar' ? r.facility.name.ar : r.facility.name.en,
            },
            availabilityId: r.availability ? Number(r.availability.id) : null,
            slotId: r.slot ? Number(r.slot.id) : null,
        }));

        return { reservations };
    }

    async findReservationsForDate(facilityId: number, date: string) {
        return this.reservationRepo.count({
            where: { facility: { id: facilityId }, date },
        });
    }

    async findUserReservations(userId: number): Promise<Reservation[]> {
        return this.reservationRepo.find({
            where: { user: { id: userId } },
            relations: ['facility'],
            order: { date: 'DESC', startTime: 'ASC' },
        });
    }

    async getMyInvoices(userId: number): Promise<GetMyInvoicesResponseDto> {
        const lang = this.i18n.lang();
        const reservations = await this.reservationRepo.find({
            where: {
                user: { id: userId },
                status: ReservationStatus.CONFIRMED,
            },
            relations: ['facility', 'slot', 'availability', 'payments'],
            order: { date: 'DESC', startTime: 'ASC' },
        });

        const invoices: UserInvoiceDto[] = [];

        for (const r of reservations) {
            const payment = r.payments && r.payments.length > 0 ? r.payments[0] : null;

            invoices.push({
                id: r.id,
                date: r.date,
                dayOfWeek: r.dayOfWeek,
                startTime: r.startTime,
                endTime: r.endTime,
                status: r.status,
                price: r.price,
                facility: {
                    id: Number(r.facility.id),
                    name: lang === 'ar' ? r.facility.name.ar : r.facility.name.en,
                },
                payment: payment
                    ? {
                          paymentId: payment.id ?? null,
                          paymentDate: payment.createdAt.toISOString(),
                          paymentStatus: payment.status,
                          title: lang === 'ar' ? (payment.title?.ar ?? null) : (payment.title?.en ?? null),
                          description:
                              lang === 'ar' ? (payment.description?.ar ?? null) : (payment.description?.en ?? null),
                          paymentIntentId: payment.stripePaymentIntentId ?? null,
                      }
                    : {
                          paymentId: null,
                          paymentDate: null,
                          paymentStatus: 'NONE',
                          title: null,
                          description: null,
                          paymentIntentId: null,
                      },
            });
        }

        return { invoices };
    }

    private getLocalTodayIso(): string {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    async findFutureReservations(userId: number): Promise<Reservation[]> {
        const today = this.getLocalTodayIso();

        return this.reservationRepo.find({
            where: {
                user: { id: userId },
                date: MoreThanOrEqual(today),
            },
        });
    }

    async countFuntureReservations(userId: number) {
        const today = this.getLocalTodayIso();
        return this.reservationRepo.count({
            where: {
                user: { id: userId },
                date: MoreThanOrEqual(today),
            },
        });
    }

    async countFacilityFuntureReservations(facilityId: number) {
        const today = this.getLocalTodayIso();

        const [facilityReservations, facilityReservationCount] = await this.reservationRepo.findAndCount({
            where: {
                facility: { id: facilityId },
                date: MoreThanOrEqual(today),
                status: In([ReservationStatus.READY, ReservationStatus.CONFIRMED]),
            },
        });

        return facilityReservationCount;
    }

    async findReservation(id: number) {
        const reservation = await this.reservationRepo.findOneBy({ id });
        return reservation;
    }

    async findReservationWithRelations(id: number) {
        const reservation = await this.reservationRepo.findOne({ where: { id }, relations: ['facility'] });
        return reservation;
    }

    async update(id: number, reservationInfo: Partial<Reservation>): Promise<Reservation> {
        const reservation = await this.reservationRepo.findOneBy({ id });
        if (!reservation) {
            throw new NotFoundException(this.i18n.t('reservations.reservationNotFound'));
        }
        Object.assign(reservation, reservationInfo);
        return this.reservationRepo.save(reservation);
    }

    private isIsoDate(iso: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(iso);
    }

    async createReservation(user: User, facilityId: number, availabilityId: number, slotId: number, dto) {
        const [facility, availability, slot] = await Promise.all([
            this.facilityService.findByIdForReservation(facilityId),
            this.schedulesService.findAvailabilityById(availabilityId),
            this.schedulesService.findSlotById(slotId),
        ]);

        if (!user) throw new BadRequestException(this.i18n.t('auth.userNotFound'));
        if (!facility) throw new NotFoundException(this.i18n.t('reservations.facilityNotFound'));
        if (!availability) throw new NotFoundException(this.i18n.t('reservations.availabilityNotFound'));
        if (!slot) throw new NotFoundException(this.i18n.t('reservations.slotNotFound'));

        if (!user.active) {
            throw new BadRequestException(this.i18n.t('errors.UserNotAuthorized'));
        }

        if (facility.status === FacilityStatus.INACTIVE) {
            throw new BadRequestException(this.i18n.t('errors.facilityInactive'));
        }

        if (
            !slot.availability ||
            String(slot.availability.id) !== String(availability.id) ||
            !availability.facility ||
            String(availability.facility.id) !== String(facility.id)
        ) {
            throw new BadRequestException(this.i18n.t('reservations.slotMismatch'));
        }

        const isoDate = dto.date;
        if (!this.isIsoDate(isoDate)) {
            throw new BadRequestException(this.i18n.t('reservations.invalidDateFormat'));
        }
        const parsed = new Date(`${isoDate}T00:00:00`);
        if (isNaN(parsed.getTime())) {
            throw new BadRequestException(this.i18n.t('reservations.invalidDateFormat'));
        }

        // Blocked Slot check

        const blocked = await this.reservationRepo.count({
            where: {
                slot: { id: slotId },
                date: isoDate,
                status: ReservationStatus.BLOCKED,
            },
        });

        if (blocked > 0) {
            throw new BadRequestException(`${this.i18n.t('reservations.alreadyReserved')} (Block reservation)`);
        }

        // Legacy reservations check

        const legacyReservations = await this.reservationRepo.find({
            where: {
                facility: { id: facilityId },
                availability: IsNull(),
                slot: IsNull(),
                date: isoDate,
                status: ReservationStatus.CONFIRMED,
            },
        });

        const newStart = slot.startTime;
        const newEnd = slot.endTime;
        let legacyCount: number = 0;

        const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && aEnd > bStart;

        for (const lr of legacyReservations) {
            if (overlaps(newStart, newEnd, lr.startTime, lr.endTime)) {
                legacyCount += 1;
            }
        }

        // let legacyCount: number = 0;
        // for (const lr of legacyReservations) {
        //     if (slot.startTime >= lr.startTime && slot.startTime < lr.endTime) {
        //         legacyCount = legacyCount + 1;
        //     }
        //     if (slot.endTime > lr.startTime && slot.endTime <= lr.endTime) {
        //         legacyCount = legacyCount + 1;
        //     }
        //     if (slot.startTime < lr.startTime && slot.endTime > lr.endTime) {
        //         legacyCount = legacyCount + 1;
        //     }
        // }

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

        let effectiveCapacity: number;
        if (capacity === null || capacity === undefined) {
            effectiveCapacity = 1;
        } else {
            const num = typeof capacity === 'number' ? capacity : parseInt(String(capacity), 10);
            effectiveCapacity = Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
        }

        let confirmedCount = await this.reservationRepo.count({
            where: {
                slot: { id: slotId },
                date: isoDate,
                status: ReservationStatus.CONFIRMED,
            },
        });
        confirmedCount = confirmedCount + legacyCount;

        const repeated = await this.reservationRepo.findOne({
            where: {
                slot: { id: slotId },
                date: isoDate,
                status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
                user: { id: user.id },
            },
        });

        if (repeated && effectiveCapacity <= 1) {
            throw new ForbiddenException(this.i18n.t('reservations.alreadyReserved'));
        }

        if (confirmedCount >= effectiveCapacity) {
            throw new ForbiddenException(this.i18n.t('reservations.alreadyReserved'));
        }

        const slotPriceCents =
            typeof slot.slotPriceCents === 'string' ? parseInt(slot.slotPriceCents, 10) : slot.slotPriceCents;

        const reservation = this.reservationRepo.create({
            date: isoDate,
            dayOfWeek: availability.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: ReservationStatus.PENDING,
            priceCents: slotPriceCents,
            user: { id: user.id },
            facility: { id: facilityId },
            availability: { id: availabilityId },
            slot: { id: slotId },
        });

        const saved = await this.reservationRepo.save(reservation);
        const fullRes = await this.reservationRepo.findOne({
            where: { id: saved.id },
            relations: ['slot', 'user', 'facility'],
        });
        if (!fullRes) {
            throw new BadRequestException('error while saving your reservation');
        }

        const response: CreateReservationResultDto = {
            reservation: {
                id: fullRes.id,
                userId: fullRes.user.id,
                slotId: fullRes.slot.id,
                date: fullRes.date,
                dayOfWeek: fullRes.dayOfWeek,
                startTime: fullRes.startTime,
                endTime: fullRes.endTime,
                status: fullRes.status,
                price:
                    (typeof fullRes.priceCents === 'string' ? parseInt(fullRes.priceCents, 10) : fullRes.priceCents) /
                    100,
                facility: {
                    id: fullRes.facility.id,
                    name: fullRes.facility.name,
                },
                slot: {
                    id: fullRes.slot.id,
                },
            },
            slotCapacity: effectiveCapacity,
            confirmedReservationsCount: confirmedCount,
        };

        return response;
    }

    // ---------- helpers ----------

    private toIsoDateString(d: Date): string {
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private localTodayMidnight(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    // --- 1) Delete PENDING reservations older than 1 day (date <= yesterday) ---
    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async deletePastPendingReservations() {
        this.logger.log('Deleting past PENDING reservations older than 1 day (date <= yesterday)...');

        const threshold = this.localTodayMidnight();
        threshold.setDate(threshold.getDate() - 1); // yesterday midnight
        const thresholdIso = this.toIsoDateString(threshold);

        const result = await this.reservationRepo.delete({
            status: ReservationStatus.PENDING,
            date: LessThanOrEqual(thresholdIso),
        });

        this.logger.log(`deletePastPendingReservations: removed ${result.affected ?? 0} rows (<= ${thresholdIso}).`);
        return { deleted: result.affected ?? 0, threshold: thresholdIso };
    }

    // --- 2) Delete APPROVED/CONFIRMED reservations older than 30 days (date <= today - 30) ---
    @Cron('5 10 * * *') // 10:05 every day
    async deletePastApprovedReservations() {
        this.logger.log('Deleting CONFIRMED reservations older than 30 days (date <= today - 30 days)...');

        const threshold = this.localTodayMidnight();
        threshold.setDate(threshold.getDate() - 30); // getDate returns the day of the month
        const thresholdIso = this.toIsoDateString(threshold);

        const result = await this.reservationRepo.delete({
            status: ReservationStatus.CONFIRMED, // or ReservationStatus.PAID depending on your enum
            date: LessThanOrEqual(thresholdIso),
        });

        this.logger.log(`deletePastApprovedReservations: removed ${result.affected ?? 0} rows (<= ${thresholdIso}).`); // number of rows the database reported as deleted.
        return { deleted: result.affected ?? 0, threshold: thresholdIso };
    }

    async cancelReservation(reservationId: number, user: User) {
        const reservation = await this.reservationRepo.findOne({
            where: { id: reservationId },
            relations: ['user'],
        });
        if (!reservation) {
            throw new NotFoundException(this.i18n.t('reservations.reservationNotFound'));
        }

        if (reservation.user.id !== user.id) {
            throw new ForbiddenException('This reservation does not belong to the current user');
        }

        if (reservation.status === ReservationStatus.DECLINED) {
            return;
        }

        reservation.status = ReservationStatus.DECLINED;
        await this.reservationRepo.save(reservation);
    }
}
