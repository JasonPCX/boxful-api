import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingCost } from './entities/shipping-cost.entity';

@Injectable()
export class ShippingCostsService {
  private readonly logger = new Logger(ShippingCostsService.name, {
    timestamp: true,
  });

  constructor(
    @InjectRepository(ShippingCost)
    private readonly shippingCostRepository: Repository<ShippingCost>,
  ) {}

  /**
   * Obtiene el costo de envío para una fecha o día específico
   * @param dateOrDay Fecha (Date) o número del día (0=Domingo, 1=Lunes, ..., 6=Sábado)
   * @returns Costo de envío configurado o 0 si no se encuentra
   * @throws InternalServerErrorException si ocurre un error al obtener el costo de envío
   */
  async getShippingCost(dateOrDay: Date | number): Promise<number> {
    try {
      const dayOfWeek =
        dateOrDay instanceof Date ? dateOrDay.getDay() : dateOrDay;

      const shippingCost = await this.shippingCostRepository.findOne({
        where: { dayOfWeek },
      });

      if (!shippingCost) {
        this.logger.warn(
          `Costo de envío no configurado para el día ${dayOfWeek}, usando 0 como valor por defecto`,
        );
        return 0;
      }

      return Number(shippingCost.shippingCost);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Error al obtener costo de envío', err.stack);

      throw new InternalServerErrorException('Error al obtener costo de envío');
    }
  }

  /**
   * Obtiene todos los costos de envío configurados
   * @returns Lista de costos de envío ordenados por día de la semana
   */
  async findAll(): Promise<ShippingCost[]> {
    const shippingCosts = await this.shippingCostRepository.find({
      order: { dayOfWeek: 'ASC' },
    });
    return shippingCosts;
  }
}
