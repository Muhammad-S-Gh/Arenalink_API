import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service';
import { Observable } from 'rxjs/dist/types';

@Injectable()
export class IsVerifiedGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private usersService: UsersService,
    ) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.id) {
            throw new ForbiddenException('User not authenticated');
        }
        if (!user.verifiedAt) {
            throw new ForbiddenException({
                message: 'You must verify your phone to perform this action',
            });
        }
        return true;
    }
}
