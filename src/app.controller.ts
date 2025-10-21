import { Controller, Get, Post, UploadedFile, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiProperty,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { User } from './modules/auth/decorators/user.decorator';
import { Public } from './modules/auth/decorators/public.decorator';
import { Roles } from './shared/decorators/roles.decorator';
import { UserRole } from './shared/enums/user-roles.enum';
import { JwtGuard } from './modules/auth/guards/jwt.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { YcI18nService } from './modules/yc-i18n/yc-i18n.service';
import { IsVerifiedGuard } from './shared/guards/is-verified.guard';
import { ApiResponseSchema } from './shared/decorators/api-response.decorator';
import { uploadInterceptor } from './shared/interceptors/upload.interceptor';
import { MailService } from './modules/mail/mail.service';

// export class CustomDTO {
//     @ApiProperty()
//     id: number;
//     @ApiProperty()
//     object: string;
// }

// @ApiTags('test')
@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly i18n: YcI18nService,
        private readonly mailService: MailService,
    ) {}
    @Public()
    @Get()
    getRoot() {
        return { message: 'Welcome to Arenalink API' };
    }
    // //
    // //
    // //
    // //
    // //
    // // *********************** TESTS
    // //
    // //
    // //
    // //
    // //
    // //
    // //
    // // @Get('User_accessed_without_the_@User_decorator')
    // // async getHello(@Request() req): Promise<string> {
    // //     const accessTokenPayload: AccessTokenPayload = req.user as AccessTokenPayload;
    // //     return await this.appService.getHello(accessTokenPayload.userId);
    // // }
    // @Public()
    // @Get('test/public')
    // @ApiOperation({ summary: 'Public test endpoint' })
    // @ApiOkResponse()
    // publicTest() {
    //     return 'Hello this is a public route';
    // }
    // @UseGuards(JwtGuard)
    // @Get('test/jwt_guarded')
    // @ApiBearerAuth()
    // @ApiOperation({ summary: 'JWT protected endpoint' })
    // @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
    // @ApiOkResponse({})
    // async Jwted(@User() user) {
    //     return await this.appService.getHello(user.id);
    // }
    // @Roles(UserRole.ADMIN)
    // @UseGuards(JwtGuard, RolesGuard)
    // @Get('test/roled_jwt_guarded')
    // @ApiBearerAuth()
    // @ApiOperation({ summary: 'Verified user endpoint' })
    // @ApiUnauthorizedResponse({ description: 'Authentication required' })
    // @ApiForbiddenResponse({ description: 'Must verify email & phone' })
    // @ApiOkResponse()
    // async RoledJwted(@User() user): Promise<string> {
    //     return await this.appService.getHello(user.id);
    // }

    // *************************************** Localization

    // @Get('test/localization')
    // getAbout() {
    //     // return this.i18n.t('common.test');
    //     return this.appService.getInfo();
    // }

    // ************************************** Return this current Language

    // @Get('test/lang')
    // getTheCurrentLang() {
    //     return this.i18n.lang();
    // }

    // ********************************** Middlewares

    // @Get('test/verified')
    // @UseGuards(JwtGuard, IsVerifiedGuard)
    // getOnlyVerified() {
    //     return 'OK this user is verified';
    // }
    // @Get('test/standard-response')
    // @UseGuards(JwtGuard, IsVerifiedGuard)
    // // data inside the response is customDTO type
    // @ApiResponseSchema(CustomDTO)
    // standardResponse() {
    //     // throw new BadRequestException('invalid');
    //     return { message: 'this is the standard response', data: { id: 1, object: 'object' } };
    // }
    // // ******************************** File upload
    // @Public()
    // @Post('test/file-upload')
    // @uploadInterceptor('profile_picture', 'profile_pictures')
    // async upload(@UploadedFile() file: Express.Multer.File) {
    //     return {
    //         filename: `profile_pictures/${file.filename}`,
    //     };
    // }
    // // ******************************** send emails
    // @Public()
    // @Get('test/mail')
    // async sendMail() {
    //     await this.mailService.sendEmail({
    //         subject: 'Welcome to the realm of NestJS',
    //         template: 'signup-confirmation-email',
    //         context: {
    //             name: 'Hammoda',
    //         },
    //         to: 'muhammadsayyahghunaim@gmail.com',
    //     });
    // }
}
