import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config';
import { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';

Injectable();
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(googleOauthConfig.KEY)
        private googleConfiguration: ConfigType<typeof googleOauthConfig>,
        private authService: AuthService,
    ) {
        super({
            clientID: googleConfiguration.webClientId,
            clientSecret: googleConfiguration.webClientSecret,
            callbackURL: googleConfiguration.callbackURL,
            scope: ['email', 'profile'],
        } as StrategyOptions);
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        console.log(profile);
        const user = await this.authService.validateGoogleUser({
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePicture: profile.photos[0].value,
            password: '',
        });
        if (!user) {
            done(new UnauthorizedException('Invalid Google token'), false);
        }
        done(null, user);
    }
}
