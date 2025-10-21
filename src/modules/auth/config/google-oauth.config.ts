import { registerAs } from '@nestjs/config';

export default registerAs('googleOAuth', () => ({
    webClientId: process.env.WEB_CLIENT_ID,
    webClientSecret: process.env.WEB_CLIENT_SECRET,
    callbackURL: process.env.WEB_CALLBACK_URL,
    androidClientId: process.env.ANDROID_CLIENT_ID,
    iosClientId: process.env.IOS_CLIENT_ID,
}));
