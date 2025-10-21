import { runSeeders } from 'typeorm-extension';
import dataSource from '../db/data-source';

async function seed() {
    try {
        await dataSource.initialize();
        await dataSource.synchronize(true);
        await runSeeders(dataSource);
    } catch (err) {
        console.error('Seeder error:', err);
        process.exit(1);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

seed();
