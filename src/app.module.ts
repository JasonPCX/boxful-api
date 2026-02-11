import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import { EnvironmentVariables, validate } from './env.validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ShippingCostsModule } from './shipping-costs/shipping-costs.module';
import databaseConfig from './config/database.config';
import { ThrottlerModule } from '@nestjs/throttler';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        type: 'mongodb',
        url: configService.get('MONGODB_URI'),
        synchronize: configService.get('DB_SYNCHRONIZE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    UsersModule,
    AuthModule,
    OrdersModule,
    ShippingCostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
