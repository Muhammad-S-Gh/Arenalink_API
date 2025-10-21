import 'source-map-support/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './shared/interceptors/respones.interceptor';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import path, { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/users.entity';
import { runSeeder } from 'typeorm-extension';
import { AdminSeeder } from './seeding/admin.seeder';
import { UserRole } from './shared/enums/user-roles.enum';
import { I18nMiddleware, I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n/dist';
import { UnifiedExceptionFilter } from './shared/filter/unified-exception.filter';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import * as Handlebars from 'handlebars';

dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    app.use(I18nMiddleware);

    app.use('/payment/webhook/stripe', bodyParser.raw({ type: 'application/json' }));

    app.use(bodyParser.json({ limit: '10mb' }));

    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    Handlebars.registerHelper('eq', (a, b) => a === b);


    const ds = app.get(DataSource);
    const userRepo = ds.getRepository(User);
    const adminCount = await userRepo.count({ where: { role: UserRole.ADMIN } });

    if (!adminCount) {
        console.log('➡️ No admin found, seeding admin...');
        await runSeeder(ds, AdminSeeder);
        console.log('✅ Admin seeded');
    }


    const uploadFolders = ['uploads/profile_pictures', 'uploads/categories', 'uploads/facilities'];
    uploadFolders.forEach((path) => {
        const dir = join(process.cwd(), path);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    });


    const config = new DocumentBuilder()
        .setTitle('Arenalink')
        .setDescription('API documentation')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                in: 'header',
                description: 'Enter JWT token',
            },
            'bearer',
        )
        .addSecurityRequirements('bearer')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);


    app.useGlobalPipes(
        new I18nValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );


    app.useGlobalFilters(new UnifiedExceptionFilter());


    app.useGlobalInterceptors(new ResponseInterceptor());


    const configService = app.get(ConfigService);
    const frontendUrl = configService.get('FRONTEND_URL');

    app.enableCors({
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        optionsSuccessStatus: 204,
    });

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.listen(port);
}
bootstrap();
