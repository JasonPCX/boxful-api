import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  MONGODB_URI: process.env.MONGODB_URI,
  DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE === 'true',
}));
