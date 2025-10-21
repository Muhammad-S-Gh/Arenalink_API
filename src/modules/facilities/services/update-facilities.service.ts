// src/modules/facilities/services/facilities.service.ts
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateFacilityStatusDto } from '../dtos/update-facility-status.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Facility } from '../entities/facility.entity';
import { Repository } from 'typeorm';
import { YcI18nService } from '../../yc-i18n/yc-i18n.service';
import { User } from '../../users/entities/users.entity';
import { UpdateFacilityDto } from '../dtos/update-facility.dto';
import { FacilityAttributeValue } from '../entities/facility-attribute-value.entity';
import { CategoryAttributeOption } from '../../categories/entities/category_attributes_options.entity';
import { AttributeType } from '../../categories/enums/attributeType.enum';
import { CategoryAttribute } from '../../categories/entities/category_attributes.entity';
import { privateDecrypt } from 'crypto';
import { Owner } from '../../users/entities/owners.entity';
import { UserRole } from '../../../shared/enums/user-roles.enum';
import { NotificationsService } from '../../../modules/notifications/notifications.service';
@Injectable()
export class Updatefacilities {
    constructor(
        private readonly ycI18n: YcI18nService,

        @InjectRepository(Facility)
        private readonly facilityRepo: Repository<Facility>,

        @InjectRepository(Owner)
        private readonly ownerRepo: Repository<Owner>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(CategoryAttribute)
        private readonly categoryAttributeRepo: Repository<CategoryAttribute>,

        @InjectRepository(FacilityAttributeValue)
        private readonly facilityAttributeValueRepo: Repository<FacilityAttributeValue>,

        @InjectRepository(FacilityAttributeValue)
        private readonly favRepo: Repository<FacilityAttributeValue>,

        private readonly notificationService: NotificationsService,
    ) {}
    async updateStatus(id: number, dto: UpdateFacilityStatusDto, user: User) {
        const facility = await this.facilityRepo.findOne({ where: { id }, relations: ['owner', 'owner.user'] });

        if (!facility) {
            throw new NotFoundException(this.ycI18n.t('errors.NotFound'));
        }

        facility.status = dto.status;
        await this.facilityRepo.save(facility);

        this.notificationService.notifyOwnerOnFacilityApproved(facility.owner.user, facility.name);

        return { message: this.ycI18n.t('common.success'), status: facility.status };
    }

    async updateFacility(id: number, dto: UpdateFacilityDto, user: User) {
        // ✅ Default arrays to avoid undefined issues
        const deletedImages = dto.deletedImages ?? [];
        const newImages = dto.newImages ?? [];
        const attributes = dto.attributes ?? [];

        // // ✅ Empty DTO check
        // if (
        //     !dto.name &&
        //     !dto.description &&
        //     (!attributes || attributes.length === 0) &&
        //     (!deletedImages || deletedImages.length === 0) &&
        //     (!newImages || newImages.length === 0) &&
        //     dto.lat === undefined &&
        //     dto.lng === undefined &&
        //     dto.pricePerHour === undefined
        // ) {
        //     throw new BadRequestException('Your request body is empty');
        // }

        // 1) Load minimal data needed for auth + images + current attributes
        const facility = await this.facilityRepo.findOne({
            where: { id },
            relations: ['owner', 'category', 'attributeValues', 'attributeValues.categoryAttribute'],
            select: {
                id: true,
                images: true,
                owner: { id: true }, // ✅ only load ownerId
                category: { id: true },
            } as any,
        });

        if (!facility) throw new NotFoundException('Facility not found');

        if (user.role == UserRole.OWNER) {
            const owner = await this.ownerRepo.findOne({
                where: { user: { id: user.id } },
                select: ['id'],
            });
            const ownerId = owner?.id;

            if (facility.owner?.id !== ownerId) {
                throw new ForbiddenException('You do not own this facility');
            }
        }
        // 2) Compute images
        const imagesSet = new Set(facility.images || []);
        for (const di of deletedImages) imagesSet.delete(di);
        for (const ni of newImages) imagesSet.add(ni);
        const finalImages = Array.from(imagesSet);

        // 3) Update base fields using UPDATE (not save)
        const patch: Partial<Facility> = {};

        // Handle localized name (require full object { en, ar })
        if (dto.name) {
            if (!dto.name.en || !dto.name.ar) {
                throw new BadRequestException(`Name must be an object { en: "any", ar: "any" }`);
            }
            patch.name = {
                en: dto.name.en ?? facility.name.en,
                ar: dto.name.ar ?? facility.name.ar,
            } as any;
        }

        // Handle localized description (require full object { en, ar })
        if (dto.description) {
            if (!dto.description.en || !dto.description.ar) {
                throw new BadRequestException(`Description must be an object { en: "any", ar: "any" }`);
            }
            patch.description = {
                en: dto.description.en ?? facility.description.en,
                ar: dto.description.ar ?? facility.description.ar,
            } as any;
        }

        // Other fields
        if (dto.lat !== undefined) patch.lat = dto.lat;
        if (dto.lng !== undefined) patch.lng = dto.lng;
        if (dto.pricePerHour !== undefined) patch.pricePerHour = dto.pricePerHour;

        patch.images = finalImages;

        await this.facilityRepo.update(id, patch);

        // 4) Attributes: update existing or insert missing
        if (attributes.length > 0) {
            for (const incoming of attributes) {
                const categoryAttribute = await this.categoryAttributeRepo.findOne({
                    where: { id: incoming.categoryAttributeId },
                    relations: ['options'],
                });
                if (!categoryAttribute) {
                    throw new BadRequestException(`Category attribute ${incoming.categoryAttributeId} not found`);
                }

                // Validation (same as you have now)
                switch (categoryAttribute.type) {
                    case AttributeType.ENUM: {
                        const optionId = Number(incoming.value);
                        if (typeof optionId !== 'number') {
                            throw new BadRequestException(`Attribute ${categoryAttribute.id} requires optionId`);
                        }
                        const exists = categoryAttribute.options?.some(
                            (o) => Number(o.id) === Number(incoming.optionId),
                        );
                        if (!exists) {
                            throw new BadRequestException(
                                `Invalid optionId ${incoming.optionId} for attribute ${categoryAttribute.id}`,
                            );
                        }
                        break;
                    }
                    case AttributeType.STRING: {
                        const v = incoming.value;
                        if (!v || typeof v !== 'object' || typeof v.en !== 'string' || typeof v.ar !== 'string') {
                            throw new BadRequestException(
                                `Attribute ${categoryAttribute.id} must be { en: string, ar: string }`,
                            );
                        }
                        if (categoryAttribute.minLimit && v.en.length < categoryAttribute.minLimit) {
                            throw new BadRequestException(`Value.en shorter than minLimit for ${categoryAttribute.id}`);
                        }
                        if (categoryAttribute.maxLimit && v.en.length > categoryAttribute.maxLimit) {
                            throw new BadRequestException(`Value.en exceeds maxLimit for ${categoryAttribute.id}`);
                        }
                        break;
                    }
                    case AttributeType.NUMBER: {
                        const valueAsNum = Number(incoming.value);
                        if (typeof valueAsNum !== 'number') {
                            throw new BadRequestException(`Expected number for attribute ${categoryAttribute.id}`);
                        }
                        if (categoryAttribute.minLimit && incoming.value < categoryAttribute.minLimit) {
                            throw new BadRequestException(`Value below minLimit for ${categoryAttribute.id}`);
                        }
                        if (categoryAttribute.maxLimit && incoming.value > categoryAttribute.maxLimit) {
                            throw new BadRequestException(`Value exceeds maxLimit for ${categoryAttribute.id}`);
                        }
                        break;
                    }
                    case AttributeType.BOOLEAN: {
                        const valueAsBool = Boolean(incoming.value);
                        if (typeof incoming.value !== 'boolean') {
                            throw new BadRequestException(`Expected boolean for attribute ${categoryAttribute.id}`);
                        }
                        break;
                    }
                }

                // Find existing attribute value for this facility
                let fav = await this.favRepo.findOne({
                    where: {
                        facility: { id },
                        categoryAttribute: { id: categoryAttribute.id },
                    },
                    relations: ['categoryAttribute'],
                });

                // If not found → create new
                if (!fav) {
                    fav = new FacilityAttributeValue();
                    fav.facility = { id } as Facility;
                    fav.categoryAttribute = categoryAttribute;
                }

                // Update values
                if (categoryAttribute.type === AttributeType.ENUM) {
                    fav.value = null as any;
                    fav.selectedOption = { id: Number(incoming.optionId) } as CategoryAttributeOption;
                } else {
                    fav.value = incoming.value as any;
                    fav.selectedOption = undefined;
                }

                await this.favRepo.save(fav);
            }
        }

        // 5) Delete physical files for deleted images
        for (const img of deletedImages) {
            try {
                const normalized = img.startsWith('/uploads') ? img.replace(/^\/+/, '') : path.join('uploads', img);
                const filePath = path.join(process.cwd(), normalized);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) {
                console.log(`image not deleted : ${e.message}`);
            }
        }

        // 6) Return updated snapshot
        const updated = await this.facilityRepo.findOne({
            where: { id },
            relations: [
                'category',
                'attributeValues',
                'attributeValues.categoryAttribute',
                'attributeValues.selectedOption',
            ],
        });

        return { message: 'success', data: updated };
    }
}
