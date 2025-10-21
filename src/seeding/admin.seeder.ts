import { AuthService } from '../modules/auth/auth.service';
import { Phone } from '../modules/phones/phones.entity';
import { User } from '../modules/users/entities/users.entity';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

export class AdminSeeder implements Seeder {
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        const app = await NestFactory.createApplicationContext(AppModule);
        const authService = app.get(AuthService);

        const userFactory = factoryManager.get(User);
        const userRepo = dataSource.getRepository(User);
        // const phoneFactory = factoryManager.get(Phone);
        // const phoneRepo = dataSource.getRepository(Phone);

        const user = await userFactory.save();
        // const phone = await phoneFactory.save({ user });
        // const token = await authService.login(user);
        // console.log('Seeding Token:', token.access_token);
        console.log('Seeding admin:', user.email);
    }
}
