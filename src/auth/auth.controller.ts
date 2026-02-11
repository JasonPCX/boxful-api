import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuthInfo } from './models/auth-info.model';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ObjectId } from 'mongodb';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
@ApiTags('Autenticación')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado exitosamente con token de acceso para auto-login',
  })
  @ApiResponse({ status: 400, description: 'Datos de registro inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      user,
      access_token: this.authService.generateAccessToken(user),
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Endpoint de inicio de sesión de usuario' })
  @ApiBody({
    description: 'Credenciales de inicio de sesión del usuario',
    schema: {
      properties: { email: { type: 'string' }, password: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Información del usuario autenticado junto con el token de acceso',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  login(@Req() req: Request) {
    const user = req.user as User;
    return {
      user,
      access_token: this.authService.generateAccessToken(user),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Información del perfil del usuario autenticado',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  getProfile(@Req() req: Request) {
    const authInfo = req.user as AuthInfo;
    const userId = authInfo.userId;

    return this.usersService.findOne(new ObjectId(userId));
  }
}
