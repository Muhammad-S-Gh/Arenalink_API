// facilities.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Facility } from '../entities/facility.entity';
import { Brackets, Repository } from 'typeorm';
import { CreateFacilityDto } from '../dtos/create-facility.dto';
import { Owner } from '../../users/entities/owners.entity';
import { Category } from '../../categories/entities/category.entity';
import { FacilityAttributeValue } from '../entities/facility-attribute-value.entity';
import { CategoryAttribute } from '../../categories/entities/category_attributes.entity';
import { AttributeType } from '../../categories/enums/attributeType.enum';
import { CategoryAttributeOption } from '../../categories/entities/category_attributes_options.entity';
import { YcI18nService } from '../../yc-i18n/yc-i18n.service';
import { GetFacilitiesQueryDto } from '../dtos/get-facilities-query.dto';
import { User } from '../../users/entities/users.entity';
import { forbidden } from 'joi/lib';
import { Favorite } from '../../favorites/entities/favorite.entity';

function coerce(val: any) {
    if (typeof val !== 'string') return val;
    const lower = val.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    const asNum = Number(val);
    return Number.isNaN(asNum) ? val : asNum;
}
@Injectable()
export class Getfacilities {
    constructor(
        @InjectRepository(Facility)
        private readonly facilityRepo: Repository<Facility>,

        @InjectRepository(Favorite)
        private readonly favoriteRepo: Repository<Favorite>,

        @InjectRepository(Owner)
        private readonly ownerRepo: Repository<Owner>,

        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,

        @InjectRepository(CategoryAttribute)
        private readonly categoryAttributeRepo: Repository<CategoryAttribute>,

        @InjectRepository(FacilityAttributeValue)
        private readonly facilityAttributeValueRepo: Repository<FacilityAttributeValue>,

        private readonly i18n: YcI18nService,
    ) {}
    async findById(id: number) {
        // 1) Find facility
        const facility = await this.facilityRepo.findOne({
            where: { id },
            relations: [
                'category',
                'attributeValues',
                'attributeValues.categoryAttribute',
                'attributeValues.categoryAttribute.options',
                'category', // if you want category in response too
                'owner', // optional if needed
                'owner.user',
            ],
        });

        if (!facility) {
            throw new NotFoundException(`Facility with id ${id} not found`);
        }

        // 3) Return facility with extra field
        return {
            ...facility,
        };
    }

    async findByIdForReservation(id: number) {
        const facility = await this.facilityRepo.findOne({
            where: { id },
            relations: [
                'category',
                'category.attributes',
                'attributeValues',
                'attributeValues.categoryAttribute',
                //
            ],
        });

        if (!facility) {
            throw new NotFoundException(`Facility with id ${id} not found`);
        }

        return facility;
    }

    async getOwnerFacilities(userId: number): Promise<Facility[]> {
        const owner = await this.ownerRepo.findOne({
            where: { user: { id: userId } },
            select: ['id'],
        });
        const ownerId = owner?.id;

        return this.facilityRepo.find({
            where: { owner: { id: ownerId } },
            relations: ['category', 'attributeValues', 'attributeValues.categoryAttribute'],
        });
    }

    async getOwnerFacilitiesCount(ownerId: number) {
        return this.facilityRepo.count({
            where: { owner: { id: ownerId } },
        });
    }

    async getOwnerFacilitiesNoRel(ownerId: number): Promise<Facility[]> {
        return this.facilityRepo.find({
            where: { owner: { id: ownerId } },
        });
    }

    // owner one facility
    async getOwnerFacility(id: number, user: User) {
        // 1) Find facility
        const facility = await this.facilityRepo.findOne({
            where: { id },
            relations: [
                'attributeValues',
                'attributeValues.categoryAttribute',
                'attributeValues.categoryAttribute.options',
                'category',
                'owner', // still needed internally to validate ownership
            ],
        });

        if (!facility) {
            throw new NotFoundException(`Facility with id ${id} not found`);
        }

        const Owner = await this.ownerRepo.findOne({
            where: { user: { id: user.id } },
            select: ['id'],
        });
        const ownerId = Owner?.id;

        if (facility.owner?.id !== ownerId) {
            throw new ForbiddenException('You do not own this facility');
        }

        // 2) Check if this facility is a favorite for this user
        let isFavorite = false;
        if (user?.id) {
            const favorite = await this.favoriteRepo.findOne({
                where: {
                    user: { id: user.id },
                    facility: { id: facility.id },
                },
            });
            isFavorite = !!favorite;
        }

        // 3) Return facility with only ownerId instead of full owner object
        const { owner, ...facilityData } = facility; // remove owner relation

        return {
            ...facilityData,
            ownerId: facility.owner?.id ?? null,
            isFavorite,
        };
    }

    async getFacility(id: number, user: User) {
        // 1) Find facility
        const facility = await this.facilityRepo.findOne({
            where: { id },
            relations: [
                'attributeValues',
                'attributeValues.categoryAttribute',
                'attributeValues.categoryAttribute.options',
                'category', // if you want category in response too
                'owner', // optional if needed
            ],
        });

        if (!facility) {
            throw new NotFoundException(`Facility with id ${id} not found`);
        }

        // 2) Check if this facility is a favorite for this user
        let isFavorite = false;
        if (user?.id) {
            const favorite = await this.favoriteRepo.findOne({
                where: {
                    user: { id: user.id },
                    facility: { id: facility.id },
                },
            });
            isFavorite = !!favorite;
        }

        // 3) Return facility with extra field
        return {
            ...facility,
            isFavorite,
        };
    }

    async getAllFacilities(query: any, user: User) {
        const page = Math.max(parseInt(query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;
        const search = (query.search || '').trim();
        const categoryId = query.categoryId ? Number(query.categoryId) : null;

        // --- parse attr[...] from query keys ---
        const attrFilters: Record<string, any> = {};
        for (const [k, v] of Object.entries(query)) {
            const m = /^attr\[(\d+)\]$/.exec(k);
            if (m) {
                attrFilters[m[1]] = coerce(v as string);
            }
        }
        if (query.attr && typeof query.attr === 'object') {
            for (const [id, v] of Object.entries(query.attr)) {
                attrFilters[id] = coerce(v as string);
            }
        }

        const qb = this.facilityRepo
            .createQueryBuilder('facility')
            .leftJoinAndSelect('facility.attributeValues', 'fav')
            .leftJoinAndSelect('fav.categoryAttribute', 'ca')
            .leftJoinAndSelect('fav.selectedOption', 'opt')
            .leftJoinAndSelect('facility.category', 'category')
            .leftJoinAndSelect('facility.owner', 'owner'); // 👈 join owner

        // 🔹 Filter by categoryId
        if (categoryId) {
            qb.andWhere('facility.category_id = :categoryId', { categoryId });
        }

        // 🔹 Search (EN/AR) on name & description
        if (search) {
            qb.andWhere(
                `(facility.name->>'en' ILIKE :s OR facility.name->>'ar' ILIKE :s
          OR facility.description->>'en' ILIKE :s OR facility.description->>'ar' ILIKE :s)`,
                { s: `%${search}%` },
            );
        }

        // 🔹 Attribute filters
        for (const [attrId, rawVal] of Object.entries(attrFilters)) {
            const pid = `attr_${attrId}`;
            const pval = `val_${attrId}`;

            qb.andWhere(
                `
        EXISTS (
          SELECT 1
          FROM "facility-attribute-values" fav2
          JOIN "category_attributes" ca2 ON ca2.id = fav2.category_attribute_id
          LEFT JOIN "category_attributes_options" opt2 ON opt2.id = fav2.option_id
          WHERE fav2.facility_id = facility.id
            AND ca2.id = :${pid}
            AND ca2.with_filters = TRUE
            AND (
              (fav2.option_id IS NOT NULL AND opt2.id::text = :${pval})
              OR
              (fav2.option_id IS NULL AND fav2.value::jsonb = :${pval}::jsonb)
            )
        )
        `,
                {
                    [pid]: Number(attrId),
                    [pval]:
                        typeof rawVal === 'number' || typeof rawVal === 'boolean'
                            ? JSON.stringify(rawVal)
                            : /^[0-9]+$/.test(String(rawVal))
                              ? String(rawVal)
                              : JSON.stringify(String(rawVal)),
                },
            );
        }

        qb.orderBy('facility.createdAt', 'DESC').skip(skip).take(limit);

        const [facilities, total] = await qb.getManyAndCount();

        // 🔹 Fetch all favorites for this user at once
        let favoriteIds: number[] = [];
        if (user?.id) {
            const favorites = await this.favoriteRepo.find({
                where: { user: { id: user.id } },
                relations: ['facility'],
            });
            favoriteIds = favorites.map((f) => f.facility.id);
        }

        // 🔹 Map isFavorite + ownerId
        const data = facilities.map((facility) => ({
            ...facility,
            ownerId: facility.owner?.id ?? null, // 👈 add ownerId here
            isFavorite: favoriteIds.includes(facility.id),
        }));

        return {
            status: 'success',
            page,
            limit,
            total,
            data,
        };
    }
}
