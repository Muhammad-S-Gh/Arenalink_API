// facilities.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Facility } from '../entities/facility.entity';
import { Any, Repository } from 'typeorm';
import { CreateFacilityDto } from '../dtos/create-facility.dto';
import { Owner } from '../../users/entities/owners.entity';
import { Category } from '../../categories/entities/category.entity';
import { FacilityAttributeValue } from '../entities/facility-attribute-value.entity';
import { CategoryAttribute } from '../../categories/entities/category_attributes.entity';
import { AttributeType } from '../../categories/enums/attributeType.enum';
import { User } from '../../users/entities/users.entity';
import { YcI18nService } from '../../yc-i18n/yc-i18n.service';
import { DataSource } from 'typeorm';
import { NotificationsService } from '../../../modules/notifications/notifications.service';

@Injectable()
export class CreateFacilities {
    constructor(
        private readonly ycI18n: YcI18nService,
        private readonly dataSource: DataSource,

        @InjectRepository(Facility)
        private readonly facilityRepo: Repository<Facility>,

        @InjectRepository(Owner)
        private readonly ownerRepo: Repository<Owner>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,

        @InjectRepository(CategoryAttribute)
        private readonly categoryAttributeRepo: Repository<CategoryAttribute>,

        @InjectRepository(FacilityAttributeValue)
        private readonly facilityAttributeValueRepo: Repository<FacilityAttributeValue>,

        private readonly notificationService: NotificationsService,
    ) {}

    async create(dto: CreateFacilityDto, user: User, imagePaths: string[]) {
        return await this.dataSource.transaction(async (manager) => {
            // 1. Load user -> owner
            const userEntity = await manager.findOne(User, {
                where: { id: user.id },
                relations: ['owner'],
            });
            const owner = userEntity?.owner;
            if (!owner) throw new NotFoundException('Owner not found');
            if (owner.status !== 'approved') throw new BadRequestException('Owner is not approved');

            // 2. Load category + attributes + options
            const category = await manager.findOne(Category, {
                where: { id: dto.categoryId },
                relations: ['attributes', 'attributes.options'],
            });
            if (!category) throw new NotFoundException('Category not found');

            // 3. Create facility (do NOT save attribute values yet)
            const facility = manager.create(Facility, {
                name: dto.name,
                description: dto.description,
                lat: dto.lat,
                lng: dto.lng,
                pricePerHour: dto.pricePerHour,
                images: imagePaths,
                status: dto.status,
                owner,
                category,
            });

            // Save facility first to get facility.id
            await manager.save(facility);

            // 4. Validate attributes & prepare FacilityAttributeValue instances
            const attributeValues: FacilityAttributeValue[] = [];

            for (const categoryAttribute of category.attributes) {
                const incomingAttr = dto.attributes?.find(
                    (a) => String(a.categoryAttributeId) === String(categoryAttribute.id),
                );

                // required check
                if (categoryAttribute.isRequired && !incomingAttr) {
                    throw new BadRequestException(`Attribute ${categoryAttribute.id} is required`);
                }
                if (!incomingAttr) continue; // optional and not provided

                const { type, options } = categoryAttribute;

                // validate by type
                switch (type) {
                    case AttributeType.ENUM: {
                        // client should send optionId in DTO for enums
                        const optionId = (incomingAttr as any).optionId ?? incomingAttr.value ?? null;
                        if (optionId == null) {
                            throw new BadRequestException(
                                `optionId is required for enum attribute ${categoryAttribute.id}`,
                            );
                        }
                        const option = options?.find((opt) => String(opt.id) === String(optionId));
                        if (!option) {
                            throw new NotFoundException(
                                `Option ${optionId} not found for attribute ${categoryAttribute.id}`,
                            );
                        }

                        // create fav - put relation in selectedOption, value stays null
                        const favEnum = new FacilityAttributeValue();
                        favEnum.facility = facility;
                        favEnum.categoryAttribute = categoryAttribute;
                        favEnum.value = null;
                        favEnum.selectedOption = option; // use the loaded option entity
                        attributeValues.push(favEnum);
                        break;
                    }

                    case AttributeType.STRING: {
                        if (
                            typeof incomingAttr.value !== 'object' ||
                            typeof incomingAttr.value.en !== 'string' ||
                            typeof incomingAttr.value.ar !== 'string'
                        ) {
                            throw new BadRequestException(
                                `Expected { en: string, ar: string } for attribute ${categoryAttribute.id}`,
                            );
                        }

                        if (
                            categoryAttribute.minLimit &&
                            (incomingAttr.value.en.length < categoryAttribute.minLimit ||
                                incomingAttr.value.ar.length < categoryAttribute.minLimit)
                        ) {
                            throw new BadRequestException(
                                `Value for attribute ${categoryAttribute.id} is shorter than minimum limit`,
                            );
                        }

                        if (
                            categoryAttribute.maxLimit &&
                            (incomingAttr.value.en.length > categoryAttribute.maxLimit ||
                                incomingAttr.value.ar.length > categoryAttribute.maxLimit)
                        ) {
                            throw new BadRequestException(
                                `Value for attribute ${categoryAttribute.id} exceeds maximum limit`,
                            );
                        }

                        const favStr = new FacilityAttributeValue();
                        favStr.facility = facility;
                        favStr.categoryAttribute = categoryAttribute;
                        favStr.value = incomingAttr.value; // will be { en, ar }
                        attributeValues.push(favStr);
                        break;
                    }

                    case AttributeType.NUMBER: {
                        const valueAsNum = Number(incomingAttr.value);
                        if (typeof valueAsNum !== 'number') {
                            throw new BadRequestException(`Expected number for attribute ${categoryAttribute.id}`);
                        }
                        if (categoryAttribute.minLimit && valueAsNum < categoryAttribute.minLimit) {
                            throw new BadRequestException(
                                `Value for attribute ${categoryAttribute.id} is less than minimum limit`,
                            );
                        }
                        if (categoryAttribute.maxLimit && valueAsNum > categoryAttribute.maxLimit) {
                            throw new BadRequestException(
                                `Value for attribute ${categoryAttribute.id} exceeds maximum limit`,
                            );
                        }

                        const favNum = new FacilityAttributeValue();
                        favNum.facility = facility;
                        favNum.categoryAttribute = categoryAttribute;
                        favNum.value = valueAsNum;
                        // favNum.selectedOption = null;
                        attributeValues.push(favNum);
                        break;
                    }

                    case AttributeType.BOOLEAN: {
                        const valueAsBool = Boolean(incomingAttr.value);
                        if (typeof valueAsBool !== 'boolean') {
                            throw new BadRequestException(`Expected boolean for attribute ${categoryAttribute.id}`);
                        }

                        const favBool = new FacilityAttributeValue();
                        favBool.facility = facility;
                        favBool.categoryAttribute = categoryAttribute;
                        favBool.value = valueAsBool;
                        // favBool.selectedOption = null;
                        attributeValues.push(favBool);
                        break;
                    }

                    default:
                        throw new BadRequestException(`Unknown attribute type for attribute ${categoryAttribute.id}`);
                }
            }

            // 5. Persist attribute values (facility already saved)
            if (attributeValues.length > 0) {
                await manager.save(attributeValues);
            }

            // optionally re-load facility with relations to return
            const saved = await manager.findOne(Facility, {
                where: { id: facility.id },
                relations: ['attributeValues', 'attributeValues.categoryAttribute', 'attributeValues.selectedOption'],
            });

            this.notificationService.notifyAdminsOnFacilityCreated();
            return { message: 'success', data: saved };
        });
    }
}
