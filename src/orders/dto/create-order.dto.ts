import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsEmail,
  IsDateString,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  Min,
  IsUUID,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { Type } from 'class-transformer';

function IsNotPastDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isNotPastDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string): boolean {
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return false;
          return date.getTime() >= Date.now();
        },
      },
    });
  };
}

export class CustomerDto {
  @ApiProperty({ description: 'Nombre del cliente final' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Apellido del cliente final' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Correo electrónico del cliente final' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Número de teléfono del cliente final' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Dirección de entrega' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Departamento' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Municipio' })
  @IsString()
  @IsNotEmpty()
  municipality: string;

  @ApiProperty({ description: 'Punto de referencia' })
  @IsString()
  @IsNotEmpty()
  referencePoint: string;

  @ApiProperty({ description: 'Indicaciones de entrega' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class PackageItemDto {
  @ApiProperty({
    description: 'Identificador único del paquete',
    example: 'a3f1c2e4-5b6d-7f8a-9b0c-d1e2f3a4b5c6',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Peso en libras', example: 5.5 })
  @IsNumber()
  @Min(0.1)
  weight: number;

  @ApiProperty({ description: 'Largo en centímetros', example: 30 })
  @IsNumber()
  @Min(1)
  length: number;

  @ApiProperty({ description: 'Ancho en centímetros', example: 20 })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({ description: 'Alto en centímetros', example: 15 })
  @IsNumber()
  @Min(1)
  height: number;

  @ApiProperty({ description: 'Contenido del paquete', example: 'Ropa' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Dirección de recolección' })
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty({
    description: 'Fecha programada de recolección',
    example: '2026-02-15',
  })
  @IsDateString(
    {},
    { message: 'scheduledPickupDate debe tener un formato de fecha válido' },
  )
  @IsNotPastDate({
    message: 'La fecha programada de recolección no puede estar en el pasado',
  })
  @IsNotEmpty()
  scheduledPickupDate: string;

  @ApiProperty({
    description: 'Indica si es una orden con cobro contra entrega (COD)',
    example: true,
  })
  @IsBoolean()
  isCod: boolean;

  @ApiProperty({
    description:
      'Monto esperado a cobrar al destinatario (requerido si isCod es true)',
    example: 50.0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  expectedAmount?: number;

  @ApiProperty({
    description: 'Información del cliente final',
    type: CustomerDto,
  })
  @ValidateNested()
  @Type(() => CustomerDto)
  @IsNotEmpty()
  customer: CustomerDto;

  @ApiProperty({
    description: 'Lista de paquetes',
    type: [PackageItemDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  packageItems: PackageItemDto[];
}
