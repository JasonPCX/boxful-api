import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { ShippingCostsService } from '../shipping-costs/shipping-costs.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name, { timestamp: true });

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly shippingCostsService: ShippingCostsService,
  ) {}

  /**
   * Crea una nueva orden con cálculos de costos y liquidación
   * @param userId Identificador del usuario que crea la orden
   * @param createOrderDto Datos de la orden a crear
   * @returns Orden creada
   * @throws BadRequestException si la orden es COD pero no se proporciona el monto esperado
   * @throws InternalServerErrorException si ocurre un error al crear la orden
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      // Validar que si es COD, se proporcione el monto esperado
      if (createOrderDto.isCod && !createOrderDto.expectedAmount) {
        throw new BadRequestException(
          'El monto esperado es requerido para órdenes con Pago Contra Entrega',
        );
      }

      // Obtener el siguiente número de orden
      const orderNumber = await this.getNextOrderNumber();

      // Obtener el costo de envío basado en la fecha programada
      const scheduledDate = new Date(createOrderDto.scheduledPickupDate);
      const shippingCost =
        await this.shippingCostsService.getShippingCost(scheduledDate);

      let settlementAmount = 0;
      if (!createOrderDto.isCod) {
        // Para ordenes sin cobro contra entrega la liquidación es negativa (solo costo de envío)
        settlementAmount -= shippingCost;
      }

      // Crear la orden con valores iniciales
      const orderToCreate = this.orderRepository.create({
        orderNumber,
        userId: userId,
        pickupAddress: createOrderDto.pickupAddress,
        scheduledPickupDate: scheduledDate,
        isCod: createOrderDto.isCod,
        expectedAmount: createOrderDto.expectedAmount,
        customer: createOrderDto.customer,
        packageItems: createOrderDto.packageItems,
        shippingCostApplied: shippingCost,
        settlementAmount,
        status: OrderStatus.PENDIENTE,
      });

      // Guardar la orden en la base de datos
      const newOrder = await this.orderRepository.save(orderToCreate);

      return newOrder;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error al crear orden: ${err.message}`, err.stack);

      throw new InternalServerErrorException('Error al crear orden');
    }
  }

  /**
   * Obtiene todas las órdenes con filtros opcionales
   * @param userId ID del usuario (opcional, para filtrar por usuario)
   * @param status Estado de la orden (opcional)
   * @param isCod Filtrar por tipo COD/No-COD (opcional)
   * @param startDate Fecha inicial del rango (opcional)
   * @param endDate Fecha final del rango (opcional)
   * @returns Lista de órdenes
   */
  async findAll(
    userId?: string,
    status?: OrderStatus,
    isCod?: boolean,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Order[]> {
    try {
      // Construir filtro compatible con MongoDB
      const where: Record<string, unknown> = {};

      if (userId) {
        where.userId = userId;
      }

      if (status) {
        where.status = status;
      }

      if (isCod !== undefined) {
        where.isCod = isCod;
      }

      // Filtrado por rango de fechas usando operadores nativos de MongoDB
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          (where.createdAt as Record<string, Date>).$gte = startDate;
        }
        if (endDate) {
          (where.createdAt as Record<string, Date>).$lte = endDate;
        }
      }

      const orders = await this.orderRepository.manager
        .getMongoRepository(Order)
        .find({
          where,
          order: { createdAt: 'DESC' },
        });

      return orders;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error al obtener órdenes: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Error al obtener órdenes');
    }
  }

  /**
   * Obtiene una orden por su ID
   * @param id ID de la orden
   * @returns Orden encontrada
   * @throws NotFoundException si no se encuentra una orden con el ID especificado
   */
  async findOne(id: ObjectId): Promise<Order> {
    const order = await this.findOneOrThrow(id);
    return order;
  }

  /**
   * Obtiene una orden por su número de orden
   * @param orderNumber Número de orden
   * @returns Orden encontrada
   * @throws NotFoundException si no se encuentra una orden con el número especificado
   * @throws UnauthorizedException si el usuario no es el propietario de la orden
   * @throws BadRequestException si la orden ya fue entregada o pagada y no se permiten actualizaciones
   * @throws InternalServerErrorException si ocurre un error al obtener la orden
   */
  async findByOrderNumber(orderNumber: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
    });
    if (!order) {
      throw new NotFoundException(
        `Orden con número #${orderNumber} no encontrada`,
      );
    }
    return order;
  }

  /**
   * Actualiza una orden existente
   *
   * @param userId ID del usuario propietario
   * @param id ID de la orden
   * @param updateOrderDto Datos a actualizar
   * @returns Orden actualizada
   */
  async update(
    userId: string,
    id: ObjectId,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    const order = await this.findOneOrThrow(id);

    if (order.userId !== userId) {
      throw new UnauthorizedException(
        'No autorizado para actualizar esta orden',
      );
    }

    // No permitir actualizaciones en órdenes ya entregadas/pagadas
    if (order.status === OrderStatus.ENTREGADA) {
      throw new BadRequestException(
        'No se pueden actualizar órdenes que ya fueron entregadas o pagadas',
      );
    }

    // Si se actualiza a orden con Cobro Contra Entrega, validar que se proporcione el monto esperado
    if (
      updateOrderDto.isCod === true &&
      updateOrderDto.expectedAmount === undefined
    ) {
      throw new BadRequestException(
        'El monto esperado es requerido para órdenes con Pago Contra Entrega',
      );
    }

    try {
      // Verificar si cambió la fecha de recogida y calcular nuevo costo de envío
      if (updateOrderDto.scheduledPickupDate) {
        const newScheduledDate = new Date(updateOrderDto.scheduledPickupDate);
        const currentScheduledDate = order.scheduledPickupDate;

        // Comparar fechas (solo la parte de fecha, sin hora)
        const isDifferentDate =
          newScheduledDate.toDateString() !==
          currentScheduledDate.toDateString();

        if (isDifferentDate) {
          const newShippingCost =
            await this.shippingCostsService.getShippingCost(newScheduledDate);

          // Solo actualizar si el costo de envío es diferente
          if (order.shippingCostApplied !== newShippingCost) {
            updateOrderDto['shippingCostApplied'] = newShippingCost;

            if (!order.isCod) {
              const settlementAmount = 0;
              updateOrderDto['settlementAmount'] =
                settlementAmount - newShippingCost;
            }
          }
        }
      }

      const orderWithChanges = this.orderRepository.merge(
        order,
        updateOrderDto,
      );
      const updatedOrder = await this.orderRepository.save(orderWithChanges);

      this.logger.log(`Orden ${id.toString()} actualizada exitosamente`);
      return updatedOrder;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error al actualizar orden: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Error al actualizar orden');
    }
  }

  /**
   * Elimina una orden (soft delete podría implementarse aquí)
   * @param id ID de la orden
   */
  async remove(userId: string, id: ObjectId): Promise<void> {
    const order = await this.findOneOrThrow(id);

    if (order.userId !== userId) {
      throw new UnauthorizedException('No autorizado para eliminar esta orden');
    }

    try {
      await this.orderRepository.delete(order._id);
      this.logger.log(`Orden ${id.toString()} eliminada exitosamente`);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error al eliminar orden con id ${id.toString()}: ${err.message}`,
        err.stack,
      );

      throw new InternalServerErrorException('Error al eliminar orden');
    }
  }

  /**
   * Webhook para actualizar el estado de una orden y calcular liquidación
   * @param orderNumber Número de orden
   * @param UpdateOrderStatusDto Datos del webhook
   * @returns Orden actualizada con cálculos de liquidación
   */
  async updateOrderStatus(
    orderNumber: number,
    UpdateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findByOrderNumber(orderNumber);

    try {
      // Validaciones
      if (UpdateOrderStatusDto.collectedAmount && !order.isCod) {
        throw new BadRequestException(
          'No se puede registrar un monto recolectado para una orden que no es Cobro Contra Entrega',
        );
      }

      // Preparar actualización
      const updateData: Partial<Order> = {
        status: UpdateOrderStatusDto.status,
      };

      // Si se marca como entregada y es COD, calcular liquidación
      if (UpdateOrderStatusDto.status === OrderStatus.ENTREGADA) {
        if (order.isCod) {
          // Para órdenes COD, usar el monto recolectado (del webhook o el esperado)
          const collectedAmount =
            UpdateOrderStatusDto.collectedAmount ?? order.expectedAmount ?? 0;

          const settlementCalculation = this.calculateSettlement(
            collectedAmount,
            order.shippingCostApplied,
          );

          updateData.collectedAmount = collectedAmount;
          updateData.collectedAt = new Date();
          updateData.codCommissionApplied = settlementCalculation.commission;
          updateData.settlementAmount = settlementCalculation.settlementAmount;

          this.logger.log(
            `Orden COD #${orderNumber} entregada. Monto recolectado: ${collectedAmount}, Liquidación: ${settlementCalculation.settlementAmount}`,
          );
        } else {
          // Para órdenes no-COD, el settlementAmount ya es negativo (solo costo de envío)
          updateData.collectedAt = new Date();
          this.logger.log(
            `Orden No-COD #${orderNumber} entregada. Liquidación: ${order.settlementAmount}`,
          );
        }
      }

      // Actualizar orden
      const orderWithChanges = this.orderRepository.merge(order, updateData);
      const updatedOrder = await this.orderRepository.save(orderWithChanges);

      this.logger.log(
        `Orden #${orderNumber} actualizada vía webhook. Estado: ${UpdateOrderStatusDto.status}`,
      );

      return updatedOrder;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error al actualizar orden con número ${orderNumber}: ${err.message}`,
        err.stack,
      );

      throw new InternalServerErrorException('Error al actualizar orden');
    }
  }

  /**
   * Calcula la liquidación para una orden COD
   * Fórmula: Monto Recolectado - Costo de Envío - Comisión
   * Comisión: 0.01% del monto recolectado con tope máximo de $25
   *
   * @param collectedAmount Monto recolectado del cliente final
   * @param shippingCost Costo del envío
   * @returns Objeto con el monto de liquidación y la comisión aplicada
   */
  private calculateSettlement(
    collectedAmount: number,
    shippingCost: number,
  ): { settlementAmount: number; commission: number } {
    // Calcular comisión: 0.01% del monto recolectado, máximo $25
    const commissionRate = 0.0001; // 0.01%
    const maxCommission = 25;
    let commission = collectedAmount * commissionRate;
    commission = Math.min(commission, maxCommission);

    // Calcular liquidación: Monto Recolectado - Costo de Envío - Comisión
    const settlementAmount = collectedAmount - shippingCost - commission;

    return {
      settlementAmount: Number(settlementAmount.toFixed(2)),
      commission: Number(commission.toFixed(2)),
    };
  }

  /**
   * Obtiene el siguiente número de orden disponible
   * @returns Siguiente número de orden
   */
  private async getNextOrderNumber(): Promise<number> {
    const lastOrder = await this.orderRepository.findOne({
      order: { orderNumber: 'DESC' },
    });

    return lastOrder ? lastOrder.orderNumber + 1 : 1;
  }

  /**
   * Exporta las órdenes del usuario a formato CSV
   * @param userId ID del usuario
   * @param status Estado de la orden (opcional)
   * @param isCod Filtrar por tipo COD/No-COD (opcional)
   * @param startDate Fecha inicial del rango (opcional)
   * @param endDate Fecha final del rango (opcional)
   * @returns String con el contenido CSV
   */
  async exportOrdersToCSV(
    userId: string,
    status?: OrderStatus,
    isCod?: boolean,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    try {
      // Obtener las órdenes con los filtros especificados
      const orders = await this.findAll(
        userId,
        status,
        isCod,
        startDate,
        endDate,
      );

      // Definir los encabezados del CSV
      const headers = [
        'Número de Orden',
        'Estado',
        'Tipo',
        'Dirección de Recogida',
        'Fecha Programada',
        'Cliente',
        'Teléfono Cliente',
        'Monto Esperado',
        'Monto Recolectado',
        'Costo de Envío',
        'Comisión COD',
        'Monto de Liquidación',
        'Fecha de Recolección',
        'Fecha de Creación',
      ];

      // Crear las filas del CSV
      const rows = orders.map((order) => {
        const customerName = order.customer
          ? `${order.customer.firstName} ${order.customer.lastName}`
          : 'N/A';
        const customerPhone = order.customer?.phoneNumber || 'N/A';
        const orderType = order.isCod ? 'COD' : 'No-COD';
        const expectedAmount = order.expectedAmount
          ? order.expectedAmount.toFixed(2)
          : 'N/A';
        const collectedAmount = order.collectedAmount
          ? order.collectedAmount.toFixed(2)
          : 'N/A';
        const shippingCost = order.shippingCostApplied.toFixed(2);
        const codCommission = order.codCommissionApplied
          ? order.codCommissionApplied.toFixed(2)
          : 'N/A';
        const settlementAmount = order.settlementAmount.toFixed(2);
        const collectedAt = order.collectedAt
          ? order.collectedAt.toISOString()
          : 'N/A';
        const createdAt = order.createdAt.toISOString();
        const scheduledDate = order.scheduledPickupDate.toISOString();

        return [
          order.orderNumber,
          order.status,
          orderType,
          `"${order.pickupAddress}"`, // Escapar direcciones con comillas
          scheduledDate,
          `"${customerName}"`,
          customerPhone,
          expectedAmount,
          collectedAmount,
          shippingCost,
          codCommission,
          settlementAmount,
          collectedAt,
          createdAt,
        ].join(',');
      });

      // Combinar encabezados y filas
      const csv = [headers.join(','), ...rows].join('\n');

      this.logger.log(
        `CSV exportado exitosamente para usuario ${userId}. Total de órdenes: ${orders.length}`,
      );

      return csv;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error al exportar CSV: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Error al exportar órdenes a CSV');
    }
  }

  /**
   * Obtiene el total a liquidar de las órdenes entregadas del usuario
   * usando agregación de MongoDB para mejor performance
   * @param userId ID del usuario
   * @param startDate Fecha inicial del rango (opcional)
   * @param endDate Fecha final del rango (opcional)
   * @returns Total a liquidar
   */
  async getSettlementTotal(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ totalSettlementAmount: number }> {
    try {
      // Construir el filtro de match
      const matchStage: Record<string, unknown> = {
        userId,
        status: OrderStatus.ENTREGADA,
      };

      // Agregar filtro de fechas si se proporcionan
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) {
          (matchStage.createdAt as Record<string, Date>).$gte = startDate;
        }
        if (endDate) {
          (matchStage.createdAt as Record<string, Date>).$lte = endDate;
        }
      }

      // Ejecutar agregación en MongoDB
      const result = await this.orderRepository.manager
        .getMongoRepository(Order)
        .aggregate<{ _id: null; totalSettlementAmount: number }>([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalSettlementAmount: { $sum: '$settlementAmount' },
            },
          },
        ])
        .toArray();

      const totalSettlementAmount: number =
        result.length > 0 ? result[0].totalSettlementAmount : 0;

      this.logger.log(
        `Total a liquidar obtenido para usuario ${userId}: ${totalSettlementAmount}`,
      );

      return {
        totalSettlementAmount: Number(totalSettlementAmount.toFixed(2)),
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error al obtener total a liquidar: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        'Error al obtener total a liquidar',
      );
    }
  }

  /**
   * Busca una orden o lanza excepción si no existe
   * @param id ID de la orden
   * @returns Orden encontrada
   */
  private async findOneOrThrow(id: ObjectId): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ _id: id });
    if (!order) {
      throw new NotFoundException(
        `Orden con id ${id.toString()} no encontrada`,
      );
    }
    return order;
  }
}
