import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/users.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'email',
        });
    }

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
