import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrderStatus } from '../enums/order-status.enum';

export class Customer {
  @ApiProperty({ type: String, description: 'El nombre del cliente' })
  @Column()
  firstName: string;

  @ApiProperty({ type: String, description: 'El apellido del cliente' })
  @Column()
  lastName: string;

  @ApiProperty({
    type: String,
    description: 'El correo electrónico del cliente',
  })
  @Column()
  email: string;

  @ApiProperty({
    type: String,
    description: 'El número de teléfono del cliente',
  })
  @Column()
  phoneNumber: string;

  @ApiProperty({
    type: String,
    description: 'La dirección de entrega del cliente',
  })
  @Column()
  address: string;

  @ApiProperty({ type: String, description: 'Departamento' })
  @Column()
  department: string;

  @ApiProperty({ type: String, description: 'Municipio' })
  @Column()
  municipality: string;

  @ApiProperty({ type: String, description: 'Punto de referencia' })
  @Column()
  referencePoint: string;

  @ApiProperty({ type: String, description: 'Indicaciones de entrega' })
  @Column()
  instructions: string;
}

export class PackageItem {
  @ApiProperty({ type: String, description: 'Identificador único del paquete' })
  @Column()
  id: string;

  @ApiProperty({ type: Number, description: 'Peso del paquete en libras' })
  @Column()
  weight: number;

  @ApiProperty({
    type: Number,
    description: 'Longitud del paquete en centímetros',
  })
  @Column()
  length: number;

  @ApiProperty({
    type: Number,
    description: 'Ancho del paquete en centímetros',
  })
  @Column()
  width: number;

  @ApiProperty({
    type: Number,
    description: 'Altura del paquete en centímetros',
  })
  @Column()
  height: number;

  @ApiProperty({ type: String, description: 'Contenido del paquete' })
  @Column()
  content: string;
}

@Entity('orders')
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Order {
  @ApiProperty({ type: String, description: 'Identificador único de la orden' })
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value?.toString(), {
    toPlainOnly: true,
  })
  _id: ObjectId;

  @ApiProperty({ type: Number, description: 'Número único de la orden' })
  @Column()
  @Index({ unique: true })
  orderNumber: number;

  @ApiProperty({
    type: String,
    description: 'Identificador del usuario que creó la orden',
  })
  @Column()
  @Index()
  userId: string;

  @ApiProperty({
    type: String,
    description: 'Dirección de recolección del paquete',
  })
  @Column()
  pickupAddress: string;

  @ApiProperty({
    type: Date,
    description: 'Fecha programada para la recolección',
  })
  @Column()
  scheduledPickupDate: Date;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si la orden es Cobro Contra Entrega (COD)',
  })
  @Column()
  isCod: boolean;

  @ApiProperty({
    type: Number,
    description: 'Monto esperado a cobrar en caso de ser COD',
  })
  @Column({ nullable: true })
  expectedAmount?: number;

  @ApiProperty({
    type: Number,
    description: 'Monto realmente cobrado al destinatario',
  })
  @Column({ nullable: true })
  collectedAmount?: number;

  @ApiProperty({
    type: Date,
    description: 'Fecha en que se realizó la recolección',
  })
  @Column({ nullable: true })
  collectedAt?: Date;

  @ApiProperty({
    type: Number,
    description: 'Costo de envío aplicado a la orden',
  })
  @Column()
  shippingCostApplied: number;

  @ApiProperty({
    type: Number,
    description: 'Comisión por Cobro Contra Entrega (COD) aplicada a la orden',
  })
  @Column()
  codCommissionApplied: number;

  @ApiProperty({
    type: Number,
    description: 'Monto de liquidación de la orden',
  })
  @Column()
  settlementAmount: number;

  @ApiProperty({
    enum: OrderStatus,
    description: 'Estado actual de la orden',
    example: OrderStatus.PENDIENTE,
  })
  @Column({ type: 'enum', enum: OrderStatus })
  @Index()
  status: OrderStatus;

  @ApiProperty({
    type: Customer,
    description: 'Información del cliente final o destinatario',
  })
  @Column(() => Customer)
  customer: Customer;

  @ApiProperty({
    type: [PackageItem],
    description: 'Lista de paquetes en la orden',
  })
  @Column()
  packageItems: PackageItem[];

  @ApiProperty({ type: Date, description: 'Fecha de creación de la orden' })
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    description: 'Fecha de última actualización de la orden',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
