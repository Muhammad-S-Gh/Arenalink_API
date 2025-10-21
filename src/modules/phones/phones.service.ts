import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phone } from './phones.entity';

@Injectable()
export class PhonesService {
    constructor(
        @InjectRepository(Phone)
        private readonly phonesRepository: Repository<Phone>,
    ) {}

    create(phone: Partial<Phone>): Promise<Phone> {
        const newPhone = this.phonesRepository.create(phone);
        return this.phonesRepository.save(newPhone);
    }

    findByPhoneNumber(phoneNumber: string): Promise<Phone | null> {
        return this.phonesRepository.findOneBy({ phoneNumber });
    }

    async findForUser(userId: number): Promise<Phone | null> {
        if (!userId) {
            return null;
        }
        // findOneBy return single Phone
        return this.phonesRepository.findOneBy({ user: { id: userId } }); // find returns array and needs {where: { user: { id: userId } } }
    }

    async update(userId: number, data: Partial<Phone>): Promise<Phone> {
        const phone = await this.findForUser(userId);
        if (!phone) {
            throw new NotFoundException('Phone not found');
        }
        Object.assign(phone, data);
        return this.phonesRepository.save(phone);
    }
}
