import { Injectable } from '@nestjs/common';
import { UsersService } from './modules/users/users.service';
import { YcI18nService } from './modules/yc-i18n/yc-i18n.service';

@Injectable()
export class AppService {
    constructor(
        private usersService: UsersService,
        private readonly i18n: YcI18nService,
    ) {}

    async getHello(userId: number): Promise<string> {
        const user = await this.usersService.findOneById(userId);
        return `Hello ${user?.firstName} !`;
    }

    getInfo() {
        return {
            about: this.i18n.t('common.test'),
            dynamic: this.i18n.t('common.greeting', { args: { username: 'Sekiro goro' } }),
        };
    }
}
