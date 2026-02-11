import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ type: String, description: 'El nombre del usuario' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ type: String, description: 'El apellido del usuario' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    type: String,
    description: 'El correo electrónico del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: String, description: 'La contraseña del usuario' })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({ type: String, description: 'El género del usuario' })
  @IsEnum(['Masculino', 'Femenino'], {
    message: 'El género debe ser "Masculino" o "Femenino"',
  })
  gender: 'Masculino' | 'Femenino';

  @ApiProperty({
    type: String,
    description: 'La fecha de nacimiento del usuario (formato: YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({
    type: String,
    description: 'El número de teléfono de WhatsApp del usuario',
  })
  @IsString()
  @IsNotEmpty()
  whatsappPhone: string;
}
