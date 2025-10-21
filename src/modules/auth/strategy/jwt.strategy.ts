import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from '../types/AccessTokenPayload';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 1️⃣ Extract "Bearer <token>" from Authorization header
            ignoreExpiration: false, // 2️⃣ Reject expired tokens
            secretOrKey: configService.get<string>('JWT_SECRET')!, // 3️⃣ Secret to verify signature
            // passReqToCallback: false,                                // 4️⃣ Optional—you only need it if your validate needs `Request`
        });
    }

    /**
     * Called by Passport after successful token validation.
     * @param payload The decoded JWT, e.g., { sub: userId, email, iat, exp }
     * @returns What gets attached to req.user
     */

    async validate(payload: AccessTokenPayload) {
        const user = await this.usersService.findOneById(payload.userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}

// 🧠 Flow when a request is received:
// A request arrives at a route protected by @UseGuards(AuthGuard('jwt')).
// Passport calls the JwtStrategy constructor once during app setup.
// On each request, Passport:
// Extracts the token from header,
// Verifies it using your secret,
// Checks expiry,
// If valid, Passport calls validate() with the decoded payload,
// You return a user or payload, which gets assigned to req.user.
// Controller logic runs with req.user available.
