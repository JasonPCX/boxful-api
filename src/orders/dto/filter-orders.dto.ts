import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

function parseIsCodValue(value: unknown): unknown {
  if (typeof value === 'boolean' || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return value;
}

export class FilterOrdersDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filtrar por estado de la orden',
    example: OrderStatus.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'El estado debe ser un valor válido' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Filtrar por tipo (true=Cobro Contra Entrega, false=No es Cobro Contra Entrega)',
    example: true,
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => parseIsCodValue(value))
  @IsBoolean({ message: 'isCod debe ser un valor booleano' })
  isCod?: boolean;

  @ApiPropertyOptional({
    type: Date,
    description: 'Fecha inicial del rango (formato ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDate debe ser una fecha válida' })
  startDate?: Date;

  @ApiPropertyOptional({
    type: Date,
    description: 'Fecha final del rango (formato ISO 8601)',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate debe ser una fecha válida' })
  @ValidateIf((o: FilterOrdersDto) => o.startDate !== undefined)
  endDate?: Date;
}
