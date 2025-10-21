import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Owner } from './entities/owners.entity';
import { Repository } from 'typeorm';
import { OwnerStatus } from '../../shared/enums/owner-statuses.enum';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';

@Injectable()
export class OwnersService {
    constructor(
        @InjectRepository(Owner)
        private ownersRepository: Repository<Owner>,
        private readonly i18n: YcI18nService,
    ) {}

    create(owner: Partial<Owner>): Promise<Owner> {
        const newOwner = this.ownersRepository.create(owner);
        return this.ownersRepository.save(newOwner);
    }

    findPendingOwners() {
        return this.ownersRepository.find({ where: { status: OwnerStatus.PENDING } });
    }

    async update(id: number, ownerInformation: Partial<Owner>): Promise<Owner> {
        const owner = await this.ownersRepository.findOneBy({ id });
        if (!owner) {
            throw new NotFoundException(this.i18n.t('users.errors.owner_not_found'));
        }
        Object.assign(owner, ownerInformation);
        return this.ownersRepository.save(owner);
    }

    async findOwnerByUserId(userId: number) {
        const owner = await this.ownersRepository.findOneBy({ user: { id: userId } });
        if (!owner) {
            throw new NotFoundException(this.i18n.t('users.errors.owner_not_found_by_user'));
        }
        return owner;
    }
}
