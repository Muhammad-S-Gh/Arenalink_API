import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { YcI18nService } from '../../modules/yc-i18n/yc-i18n.service';
import { OwnersService } from '../../modules/users/owners.service';
import { OwnerStatus } from '../enums/owner-statuses.enum';

@Injectable()
export class ValidOwnerGuard implements CanActivate {
    constructor(
        private readonly i18n: YcI18nService,
        private readonly ownersService: OwnersService,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.id) {
            throw new ForbiddenException(this.i18n.t('errors.UserNotAuthenticated'));
        }
        const owner = await this.ownersService.findOwnerByUserId(user.id);
        if (owner.status !== OwnerStatus.APPROVED) {
            throw new ForbiddenException(this.i18n.t('errors.OwnerNotAuthorized'));
        }
        return true;
    }
}
