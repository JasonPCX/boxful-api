import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'mongodb',
  url: process.env.MONGODB_URI,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
});

export default dataSource;
