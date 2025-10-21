import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PersonalAccessTokenService } from '../personal-access-token.service';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
        private readonly patService: PersonalAccessTokenService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext) {
        // 🔍 Check if the route or controller has @Public() metadata.
        // getAllAndOverride checks handler first, then class.
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const ok = (await super.canActivate(context)) as boolean;
        if (!ok) return false;

        const req = context.switchToHttp().getRequest();
        const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        const { userId } = req.user as { userId: number };

        try {
            await this.patService.findOnebyToken(userId, rawToken);
            return true;
        } catch {
            return false;
        }
    }
}
