import { User } from '../modules/users/entities/users.entity';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';

export class AdminSeeder implements Seeder {
    async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        const userFactory = factoryManager.get(User);
        const user = await userFactory.save();
        console.log('Seeding admin:', user.email);
    }
}
