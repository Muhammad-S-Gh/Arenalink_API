import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/users.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        // ⚙️ Pass options to Passport: by default, it expects "username" & "password".
        // Here, we tell it to use "email" instead of "username".
        super({
            usernameField: 'email',
        });
    }

    /**
     * Called automatically by Passport when AuthGuard('local') is used.
     * @param email - pulled from req.body.email
     * @param password - pulled from req.body.password
     * @returns {Promise<User>} - validated user object or throws UnauthorizedException
     */

    async validate(email: string, password: string): Promise<User> {
        if (password === '') {
            throw new UnauthorizedException('Please provide the password');
        }
        const user = await this.authService.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('No user found');
        }
        return user;
    }
}
