import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { SeederOptions } from 'typeorm-extension';
import { UserFactory } from '../seeding/user.factory';

config({ path: path.resolve(__dirname, '../../.env') });

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [path.join(__dirname, '../modules/**/*.entity.{ts,js}')],
    migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
    logging: process.env.NODE_ENV !== 'production',
    synchronize: process.env.NODE_ENV !== 'production',
    ssl: false,
    factories: [UserFactory],
    seeds: [],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
