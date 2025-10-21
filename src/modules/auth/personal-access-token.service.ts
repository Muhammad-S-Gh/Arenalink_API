import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersonalAccessToken } from './entities/personal-access-tokens.entity';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PersonalAccessTokenService {
    constructor(
        @InjectRepository(PersonalAccessToken)
        private patRepository: Repository<PersonalAccessToken>,
        private readonly i18n: YcI18nService,
    ) {}

    create(personalAccessToken: Partial<PersonalAccessToken>): Promise<PersonalAccessToken> {
        const pat = this.patRepository.create(personalAccessToken);
        return this.patRepository.save(pat);
    }

    async findOnebyToken(tokenableId: number, token: string | null): Promise<PersonalAccessToken> {
        if (!token) throw new BadRequestException('Token is required.');

        const now = new Date();
        const cands = await this.patRepository.find({
            where: { tokenableType: 'User', tokenableId, expiresAt: MoreThan(now) },
        });

        for (const pat of cands) {
            if (await bcrypt.compare(token, pat.token)) {
                return pat;
            }
        }
        throw new NotFoundException('Token expired or not found');
    }

    async delete(id: number) {
        return this.patRepository.delete(id);
    }

    async deleteExpiredPats() {
        return this.patRepository.delete({ expiresAt: LessThan(new Date()) });
    }
}
