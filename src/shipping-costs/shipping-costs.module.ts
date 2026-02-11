import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingCost } from './entities/shipping-cost.entity';
import { ShippingCostsService } from './shipping-costs.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingCost])],
  providers: [ShippingCostsService],
  exports: [ShippingCostsService],
})
export class ShippingCostsModule {}
