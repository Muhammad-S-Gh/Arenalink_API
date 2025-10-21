// facilities.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from '../entities/facility.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { User } from '../../users/entities/users.entity';
import { Owner } from '../../users/entities/owners.entity';
import { UserRole } from '../../../shared/enums/user-roles.enum';
import { FacilityStatus } from '../enums/facility-status.enum';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { YcI18nService } from '../../../modules/yc-i18n/yc-i18n.service';
import { ReservationsService } from '../../../modules/reservations/reservations.service';

@Injectable()
export class DeleteFacility {
    constructor(
        @InjectRepository(Facility)
        private readonly facilityRepo: Repository<Facility>,

        @InjectRepository(Reservation)
        private readonly reservationRepo: Repository<Reservation>,

        private readonly reservationService: ReservationsService,

        @InjectRepository(Owner)
        private readonly ownerRepo: Repository<Owner>,

        private readonly i18n: YcI18nService,
    ) {}

    async deleteFacility(facilityId: number, user: User) {
        // 1) Find facility with owner + images
        const facility = await this.facilityRepo.findOne({
            where: { id: facilityId },
            relations: ['owner'],
        });

        if (!facility) {
            throw new NotFoundException('Facility not found');
        }

        // 2) Role-based checks
        if (user.role === UserRole.ADMIN) {
            if (facility.status === FacilityStatus.ACTIVE) {
                throw new BadRequestException(
                    'This facility is active now. You must change its status before deleting it.',
                    'this facility is active now you have to change its status before deleting it',
                );
            }
        } else if (user.role === UserRole.OWNER) {
            const owner = await this.ownerRepo.findOne({
                where: { user: { id: user.id } },
                select: ['id'],
            });
            const ownerId = owner?.id;

            if (facility.owner.id !== ownerId) {
                throw new ForbiddenException('You do not own this facility');
            }
        }

        const futureReservations = await this.reservationService.countFacilityFuntureReservations(facilityId);
        if (futureReservations > 0) {
            throw new BadRequestException('You have future reservations to fulfill');
        }

        // --- delete physical files ---
        if (facility.images?.length) {
            for (const imgPath of facility.images) {
                try {
                    // Remove leading "/" if exists
                    const relativePath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;

                    // Go from project root
                    const fullPath = path.resolve(process.cwd(), relativePath);

                    console.log('🗑️ Deleting:', fullPath);

                    await fs.unlink(fullPath);
                } catch (err) {
                    console.error(`Failed to delete ${imgPath}`, err.message);
                }
            }
        }

        // 5) Delete facility from DB
        await this.facilityRepo.remove(facility);

        // delete the images attached to this facility

        return { status: 'success', message: 'Facility deleted successfully' };
    }
}
