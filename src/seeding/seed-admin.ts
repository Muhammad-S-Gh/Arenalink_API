import dataSource from '../db/data-source';
import { runSeeder } from 'typeorm-extension';
import { AdminSeeder } from './admin.seeder';

async function seed() {
    await dataSource.initialize();
    await runSeeder(dataSource, AdminSeeder);
}
seed();
