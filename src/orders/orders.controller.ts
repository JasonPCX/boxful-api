import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UnprocessableEntityException,
  HttpStatus,
  HttpCode,
  Query,
  UseGuards,
  Req,
  Header,
  Res,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { ObjectId } from 'mongodb';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type Request, type Response } from 'express';
import { AuthInfo } from 'src/auth/models/auth-info.model';

@Controller('orders')
@ApiTags('Órdenes')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear una nueva orden' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Orden creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description:
      'El monto esperado es requerido para órdenes con Pago Contra Entrega',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  create(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const authInfo = req.user as AuthInfo;
    const userId = authInfo.userId;
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obtener todas las órdenes del usuario con filtros opcionales',
    description:
      'Permite filtrar órdenes por estado, tipo (COD/No-COD) y rango de fechas. Los filtros son opcionales y se pueden combinar.',
  })
  @ApiQuery({ type: FilterOrdersDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes obtenida exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de filtrado inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  findAll(@Req() req: Request, @Query() filters: FilterOrdersDto) {
    const authInfo = req.user as AuthInfo;
    const userId = authInfo.userId;
    return this.ordersService.findAll(
      userId,
      filters.status,
      filters.isCod,
      filters.startDate,
      filters.endDate,
    );
  }

  @Get('settlement-total')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obtener total a liquidar del usuario',
    description:
      'Obtiene el total a liquidar de las órdenes entregadas del usuario. Se pueden aplicar filtros por rango de fechas.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Fecha inicial del rango (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Fecha final del rango (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Total a liquidar obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalSettlementAmount: {
          type: 'number',
          description: 'Total a liquidar',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  getSettlementTotal(@Req() req: Request, @Query() filters: FilterOrdersDto) {
    const authInfo = req.user as AuthInfo;
    const userId = authInfo.userId;
    return this.ordersService.getSettlementTotal(
      userId,
      filters.startDate,
      filters.endDate,
    );
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  @ApiOperation({
    summary: 'Exportar órdenes del usuario a CSV',
    description:
      'Descarga todas las órdenes del usuario autenticado en formato CSV. Los filtros de fecha y estado se pueden aplicar mediante query params.',
  })
  @ApiProduces('text/csv')
  @ApiQuery({ type: FilterOrdersDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Archivo CSV generado exitosamente',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async exportToCSV(
    @Req() req: Request,
    @Query() filters: FilterOrdersDto,
    @Res() res: Response,
  ): Promise<void> {
    const authInfo = req.user as AuthInfo;
    const userId = authInfo.userId;
    const csv: string = await this.ordersService.exportOrdersToCSV(
      userId,
      filters.status,
      filters.isCod,
      filters.startDate,
      filters.endDate,
    );
    res.send(csv);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener una orden por ID' })
  @ApiResponse({
    status: 200,
    description: 'Orden obtenida exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 422,
    description: 'ID inválido',
  })
  findOne(@Param('id') id: string) {
    if (!ObjectId.isValid(id)) {
      throw new UnprocessableEntityException('ID inválido');
    }
    return this.ordersService.findOne(new ObjectId(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar una orden por ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Orden actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 422,
    description: 'ID inválido',
  })
  @ApiResponse({
    status: 400,
    description:
      'No se pueden actualizar órdenes que ya fueron entregadas o pagadas',
  })
  @ApiResponse({
    status: 400,
    description:
      'El monto esperado es requerido para órdenes con Pago Contra Entrega',
  })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req: Request,
  ) {
    const authInfo = req.user as AuthInfo;
    const userId = authInfo.userId;
    if (!ObjectId.isValid(id)) {
      throw new UnprocessableEntityException('ID inválido');
    }
    return this.ordersService.update(userId, new ObjectId(id), updateOrderDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una orden por ID' })
  @ApiResponse({
    status: 204,
    description: 'Orden eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 422,
    description: 'ID inválido',
  })
  remove(@Param('id') id: string, @Req() req: Request) {
    const authInfo = req.user as AuthInfo;
    const userId = authInfo.userId;
    if (!ObjectId.isValid(id)) {
      throw new UnprocessableEntityException('ID inválido');
    }
    return this.ordersService.remove(userId, new ObjectId(id));
  }

  @Post('webhook/:orderNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para actualizar estado de orden y registrar pago',
  })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description:
      'Orden actualizada exitosamente con cálculos de liquidación aplicados',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 400,
    description:
      'No se puede registrar un monto recolectado para una orden que no es Cobro Contra Entrega',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  updateOrderStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() UpdateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const orderNum = parseInt(orderNumber, 10);
    if (isNaN(orderNum)) {
      throw new UnprocessableEntityException('Número de orden inválido');
    }
    return this.ordersService.updateOrderStatus(orderNum, UpdateOrderStatusDto);
  }
}
