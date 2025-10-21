import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FacilityAvailability } from './entities/facility-availability.entity';
import { DataSource, DeepPartial, In, IsNull, Not, Repository } from 'typeorm';
import { FacilitySlot } from './entities/facility-slot.entity';
import { CreateAvailabilityDTO } from './dtos/create-availability.dto';
import { FacilityStatus } from '../facilities/enums/facility-status.enum';
import { FacilityDayOff } from './entities/facility-days-off.entity';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import { Getfacilities } from '../facilities/services/getfacilities.service';
import { HolidayDto } from './dtos/holiday.dto';
import { SpecificHolidayDto } from './dtos/specific-holiday.dto';
import { plainToInstance } from 'class-transformer';
import { SpecificHolidayResponseDto } from './dtos/specific-holiday-response.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { BlockSlotDto } from './dtos/block-slot.dto';
import { ReservationStatus } from '../reservations/enums/reservation-status.enum';
import { User } from '../users/entities/users.entity';
import { SlotPriceDto } from './dtos/slot-price.dto';
import { SlotPriceResponseDto } from './dtos/slot-price-response.dto';
import { FacilityScheduleDto } from './dtos/schedule-response.dto';
import { AvailabilityDetailDto, ReservationDto, SlotsDto } from './dtos/get-availability-info.dto';
import { AttributeType } from '../categories/enums/attributeType.enum';
import { OwnerReservationStatuses } from './enums/owner-reservation-status.enum';

@Injectable()
export class SchedulesService {
    constructor(
        @InjectRepository(FacilityAvailability)
        private readonly availabilityRepository: Repository<FacilityAvailability>,
        @InjectRepository(FacilitySlot)
        private readonly slotsRepository: Repository<FacilitySlot>,
        @InjectRepository(FacilityDayOff)
        private readonly dayOffRepository: Repository<FacilityDayOff>,
        private readonly facilityService: Getfacilities,
        @Inject(forwardRef(() => ReservationsService))
        private readonly reservationService: ReservationsService,
        private dataSource: DataSource,
        private readonly i18n: YcI18nService,
    ) {}

    async deleteHoliday(facilityId: number, holidayId: number, user: User) {
        const facility = await this.facilityService.findById(facilityId);
        if (!facility || facility.owner.user.id !== user.id) {
            throw new BadRequestException(this.i18n.t('errors.facilityNotFound'));
        }
        const holiday = await this.dayOffRepository.findOne({ where: { id: holidayId }, relations: ['facility'] });
        if (!holiday) {
            throw new BadRequestException('holiday not found');
        }

        if (Number(holiday.facility.id) !== Number(facilityId)) {
            throw new BadRequestException('holiday not found (facility mismatch)');
        }

        return this.dayOffRepository.delete({ id: holidayId });
    }

    async deleteSpecificHoliday(facilityId: number, holidayId: number, user: User) {
        const facility = await this.facilityService.findById(facilityId);
        if (!facility || facility.owner.user.id !== user.id) {
            throw new BadRequestException(this.i18n.t('errors.facilityNotFound'));
        }
        const holiday = await this.dayOffRepository.findOne({ where: { id: holidayId }, relations: ['facility'] });
        if (!holiday) {
            throw new BadRequestException('holiday not found');
        }

        if (Number(holiday.facility.id) !== Number(facilityId)) {
            throw new BadRequestException('holiday not found (facility mismatch)');
        }

        if (!holiday.date) {
            throw new BadRequestException('wrong input this is recurring holiday');
        }

        return this.dayOffRepository.delete({ id: holidayId });
    }

    async findSlotById(id: number) {
        const slot = await this.slotsRepository.findOne({ where: { id }, relations: ['availability'] });
        return slot;
    }

    async findAvailabilityById(id: number) {
        const availability = await this.availabilityRepository.findOne({ where: { id }, relations: ['facility'] });
        return availability;
    }

    async createAvailability(facilityId: number, dto: CreateAvailabilityDTO): Promise<FacilityAvailability> {
        const facility = await this.facilityService.findById(facilityId);
        if (!facility) {
            throw new NotFoundException(this.i18n.t('errors.facilityNotFound'));
        }
        if (facility?.status === FacilityStatus.INACTIVE) {
            throw new ForbiddenException(this.i18n.t('errors.facilityInactive'));
        }

        const [conflictAvail, conflictOff] = await Promise.all([
            this.availabilityRepository.findOne({ where: { facility: { id: facilityId }, dayOfWeek: dto.dayOfWeek } }),
            this.dayOffRepository.findOne({
                where: { facility: { id: facilityId }, dayOfWeek: dto.dayOfWeek, date: IsNull() },
            }),
        ]);

        if (conflictAvail || conflictOff) {
            throw new BadRequestException(this.i18n.t('schedules.duplicateDay'));
        }

        const avail = this.availabilityRepository.create({
            facility,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            slotInterval: dto.slotInterval,
        });
        await this.availabilityRepository.save(avail);

        await this.seedSlotsForDay(avail, facility.pricePerHour);

        return this.availabilityRepository.findOneOrFail({
            where: { id: avail.id },
            relations: ['slots'],
        });
    }

    private async seedSlotsForDay(avail: FacilityAvailability, pricePerHour: number) {
        const parse = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const startMin = parse(avail.startTime);
        const endMin = parse(avail.endTime);
        const intervalMin = parse(avail.slotInterval);

        const slots: FacilitySlot[] = [];
        let cursor = startMin;

        while (cursor < endMin) {
            const next = Math.min(cursor + intervalMin, endMin);
            const durationMin = next - cursor;

            const pricePerHourCents = Math.round(Number(pricePerHour) * 100);
            const slotPriceCents = Math.round((durationMin * pricePerHourCents) / 60);
            const slotPriceDollars = slotPriceCents / 100;

            const slot = this.slotsRepository.create({
                facility: avail.facility,
                availability: avail,
                dayOfWeek: avail.dayOfWeek,
                startTime: this.minutesToTime(cursor),
                endTime: this.minutesToTime(next),
                slotPrice: slotPriceDollars,
                slotPriceCents,
            });

            slots.push(slot);
            cursor = next;
        }

        await this.slotsRepository.save(slots);
    }

    private minutesToTime(mins: number): string {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    async createHoliday(facilityId: number, dto: HolidayDto) {
        const [holiday, schedule] = await Promise.all([
            this.availabilityRepository.findOne({ where: { facility: { id: facilityId }, dayOfWeek: dto.dayOfWeek } }),
            this.dayOffRepository.findOne({
                where: { facility: { id: facilityId }, dayOfWeek: dto.dayOfWeek, date: IsNull() },
            }),
        ]);

        if (holiday || schedule) {
            throw new BadRequestException(this.i18n.t('schedules.duplicateDay'));
        }

        const facility = await this.facilityService.findById(facilityId);
        const dayOff = this.dayOffRepository.create({
            dayOfWeek: dto.dayOfWeek,
            reason: dto.reason,
            facility,
            date: null,
        });

        await this.dayOffRepository.save(dayOff);
        return this.dayOffRepository.find({ where: { id: dayOff.id } });
    }

    async createSpecificHoliday(facilityId: number, dto: SpecificHolidayDto) {
        const isoDate = dto.date.toISOString().split('T')[0];
        const dateOnly = new Date(isoDate);

        const dayOfWeek = dto.dayOfWeek;
        const availability = await this.availabilityRepository.findOne({
            where: {
                facility: { id: facilityId },
                dayOfWeek,
                isAvailable: true,
            },
        });

        if (!availability) {
            throw new BadRequestException('This day is already considered as a dayoff / No schedule for this day');
        }

        const existingRecurring = await this.dayOffRepository.findOne({
            where: {
                facility: { id: facilityId },
                dayOfWeek,
                date: IsNull(),
            },
        });

        if (existingRecurring) {
            throw new BadRequestException('This day is already marked as holiday');
        }

        // ***********************

        const reservationsCount = await this.reservationService.findReservationsForDate(facilityId, isoDate);
        if (reservationsCount > 0) {
            throw new BadRequestException('Cannot mark date as holiday because it has existing reservations');
        }

        const existingSpecific = await this.dayOffRepository.findOne({
            where: {
                facility: { id: facilityId },
                date: dateOnly,
            },
        });

        if (existingSpecific) {
            throw new BadRequestException('This specific date is already marked as holiday');
        }

        const facility = await this.facilityService.findById(facilityId);
        const newDayOff = this.dayOffRepository.create({
            facility,
            dayOfWeek,
            reason: dto.reason,
            date: dateOnly,
        });

        const saved = await this.dayOffRepository.save(newDayOff);

        const response: SpecificHolidayResponseDto = {
            id: saved.id,
            facility: {
                id: saved.facility.id,
                name: saved.facility.name,
            },
            dayOfWeek: saved.dayOfWeek,
            date: saved.date,
            reason: saved.reason,
        };

        return response;
    }

    async deleteAvailability(facilityId: number, availabilityId: number): Promise<void> {
        const availability = await this.availabilityRepository.findOne({
            where: { id: availabilityId, facility: { id: facilityId } },
        });
        if (!availability) {
            throw new NotFoundException('Availability not found');
        }

        await this.availabilityRepository.delete(availabilityId);
    }

    async markSpecificSlotAsBooked(
        facilityId: number,
        availabilityId: number,
        slotId: number,
        user: User,
        dto: BlockSlotDto,
    ) {
        const isoDate = dto.date.toISOString().split('T')[0];
        const lang = this.i18n.lang();

        return this.dataSource.transaction(async (manager) => {
            const [facility, availability, slot] = await Promise.all([
                this.facilityService.findByIdForReservation(facilityId),
                this.findAvailabilityById(availabilityId),
                this.findSlotById(slotId),
            ]);

            if (!facility) throw new NotFoundException(this.i18n.t('reservations.facilityNotFound'));
            if (!availability) throw new NotFoundException(this.i18n.t('reservations.availabilityNotFound'));
            if (!slot) throw new NotFoundException(this.i18n.t('reservations.slotNotFound'));

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

            const reservationsCount = await manager.count(Reservation, {
                where: {
                    slot: { id: slotId },
                    date: isoDate,
                    status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
                },
            });
            if (reservationsCount > 0) {
                throw new BadRequestException('Cannot mark slot as blocked because it has existing reservations');
            }

            const reservation = manager.create(Reservation, {
                date: isoDate,
                dayOfWeek: availability.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: ReservationStatus.BLOCKED,
                priceCents: slot.slotPriceCents,
                user: { id: user.id },
                facility: { id: facilityId },
                availability: { id: availabilityId },
                slot: { id: slotId },
            });

            const saved = await manager.save(reservation);

            return {
                id: saved.id,
                facilityId: facility.id,
                facilityName: lang === 'ar' ? facility.name.ar : facility.name.en,
                availabilityId: availability.id,
                slotId: slot.id,
                date: saved.date,
                dayOfWeek: saved.dayOfWeek,
                startTime: saved.startTime,
                endTime: saved.endTime,
                status: saved.status,
            };
        });
    }

    //

    //

    //

    async OwnerchangesReservationStatus(
        facilityId: number,
        user: User,
        reservationId: number,
        status: OwnerReservationStatuses,
    ) {
        const facility = await this.facilityService.findByIdForReservation(facilityId);
        if (!facility) throw new NotFoundException(this.i18n.t('reservations.facilityNotFound'));

        const reservation = await this.reservationService.findReservationById(reservationId);
        if (!reservation || reservation.status !== ReservationStatus.PENDING) {
            throw new BadRequestException(this.i18n.t('reservations.reservationNotFound'));
        }

        const legacyCount = await this.reservationService.countLegacyOverlappingReservations(
            facilityId,
            reservation.date,
            reservation.startTime,
            reservation.endTime,
        );

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

        let confirmedCount = await this.reservationService.countDateConfirmedReservations(
            reservation.slot.id,
            reservation.date,
        );
        confirmedCount = confirmedCount + legacyCount;

        if (confirmedCount >= effectiveCapacity) {
            throw new ForbiddenException(this.i18n.t('reservations.alreadyReserved'));
        }

        if (status === OwnerReservationStatuses.REJECTED) {
            await this.reservationService.update(reservationId, {
                status: ReservationStatus.REJECTED,
            });

            const updated = await this.reservationService.findReservation(reservationId);
            return { updated, effectiveCapacity, confirmedCount };
        }

        await this.reservationService.update(reservationId, {
            status: ReservationStatus.READY,
        });

        const updated = await this.reservationService.findReservation(reservationId);
        return { updated, effectiveCapacity, confirmedCount };
    }

    async changeSlotPrice(
        facilityId: number,
        availabilityId: number,
        slotId: number,
        user: User,
        dto: SlotPriceDto,
    ): Promise<SlotPriceResponseDto> {
        const lang = this.i18n.lang();
        const newPriceCents = Math.round(dto.price * 100);

        return this.dataSource.transaction(async (manager) => {
            const [facility, availability, slot] = await Promise.all([
                this.facilityService.findByIdForReservation(facilityId),
                this.findAvailabilityById(availabilityId),
                this.findSlotById(slotId),
            ]);

            if (!facility) throw new NotFoundException(this.i18n.t('reservations.facilityNotFound'));
            if (!availability) throw new NotFoundException(this.i18n.t('reservations.availabilityNotFound'));
            if (!slot) throw new NotFoundException(this.i18n.t('reservations.slotNotFound'));

            if (facility.status === FacilityStatus.INACTIVE) throw new BadRequestException('Facility is inactive');
            if (
                !slot.availability ||
                slot.availability.id !== availability.id ||
                availability.facility.id !== facility.id
            ) {
                throw new BadRequestException(this.i18n.t('reservations.slotMismatch'));
            }

            await manager.update(
                FacilitySlot,
                { id: slotId },
                {
                    slotPriceCents: newPriceCents,
                    slotPrice: dto.price,
                },
            );

            return {
                slotId,
                facilityName: lang === 'ar' ? facility.name.ar : facility.name.en,
                facilityId: facility.id,
                availabilityId: availability.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                price: dto.price,
            };
        });
    }

    async getSchedule(facilityId: number): Promise<FacilityScheduleDto> {
        const recurringHoliday = await this.dayOffRepository.find({
            where: { facility: { id: facilityId }, date: IsNull() },
        });

        const specificDateHoliday = await this.dayOffRepository.find({
            where: { facility: { id: facilityId }, date: Not(IsNull()) },
        });

        const availabilities = await this.availabilityRepository.find({
            where: { facility: { id: facilityId } },
            // relations: ['slots', 'slots.reservations'], // we will make a route to fetch the availability slots later with conditions
        });

        const availableDays: Partial<FacilityAvailability>[] = availabilities.map((a) => {
            const { slots, ...rest } = a;
            return rest;
        });

        const legacyReservations = await this.reservationService.findFacilityLegaceReservations(facilityId);

        return {
            facilityId: facilityId,
            recurringHolidays: recurringHoliday,
            dateSpecificHolidays: specificDateHoliday,
            availableDays,
            legacyReservations,
        };
    }

    async getSlots(facilityId: number, availabilityId: number): Promise<AvailabilityDetailDto> {
        const allowedStatuses = [ReservationStatus.CONFIRMED, ReservationStatus.BLOCKED];

        const qb = this.availabilityRepository
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.slots', 'slot')
            .leftJoinAndSelect('slot.reservations', 'reservation', 'reservation.status IN (:...statuses)', {
                statuses: allowedStatuses,
            })
            .where('a.id = :availabilityId', { availabilityId })
            .andWhere('a.facility_Id = :facilityId', { facilityId })
            .orderBy('slot.startTime', 'ASC')
            .addOrderBy('reservation.date', 'ASC');

        const availability = await qb.getOne();

        if (!availability) {
            throw new BadRequestException(this.i18n.t('reservations.availabilityNotFound'));
        }

        const facility = await this.facilityService.findByIdForReservation(facilityId);

        let capacity: any = null;
        const facilityAttrs = facility?.category?.attributes ?? [];

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

        const slots: SlotsDto[] = (availability.slots ?? []).map((s: any) => {
            const reservations: ReservationDto[] = (s.reservations ?? []).map((r: any) => ({
                id: Number(r.id),
                date: r.date,
                dayOfWeek: r.dayOfWeek,
                startTime: r.startTime,
                endTime: r.endTime,
                status: r.status,
                price: r.price,
            }));

            return {
                id: Number(s.id),
                startTime: s.startTime,
                endTime: s.endTime,
                slotPrice: Number(s.slotPrice ?? 0),
                reservations,
                slotCapacity: effectiveCapacity,
                confirmedReservationsCount: Array.isArray(s.reservations) ? s.reservations.length : 0,
            };
        });

        const result: AvailabilityDetailDto = {
            id: Number(availability.id),
            facilityId: facilityId,
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime,
            endTime: availability.endTime,
            isAvailable: availability.isAvailable ?? true,
            slotInterval: availability.slotInterval ?? null,
            slots,
        };

        return plainToInstance(AvailabilityDetailDto, result);
    }
}
