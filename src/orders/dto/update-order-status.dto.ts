import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la orden',
    enum: OrderStatus,
    example: OrderStatus.ENTREGADA,
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiProperty({
    description:
      'Monto real recolectado del cliente final (solo para órdenes de tipo COD)',
    example: 55.0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  collectedAmount?: number;
}
