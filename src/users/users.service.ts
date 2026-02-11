import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ObjectId, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name, { timestamp: true });

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo usuario en el sistema
   * @param createUserDto - Datos del usuario a crear
   * @returns Promise con el usuario creado
   * @throws BadRequestException si el email o teléfono de WhatsApp ya existe
   * @throws InternalServerErrorException si ocurre un error al crear el usuario
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUserByEmail = await this.findByEmail(createUserDto.email);
      if (existingUserByEmail) {
        throw new BadRequestException(
          `Ya existe un usuario con el email ${createUserDto.email}`,
        );
      }

      const existingUserByWhatsappPhone = await this.findByWhatsappPhone(
        createUserDto.whatsappPhone,
      );
      if (existingUserByWhatsappPhone) {
        throw new BadRequestException(
          `Ya existe un usuario con el número de WhatsApp ${createUserDto.whatsappPhone}`,
        );
      }

      const userToCreate = this.userRepository.create(createUserDto);
      const newUser = await this.userRepository.save(userToCreate);
      return newUser;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error al crear usuario: ${err.message}`, err.stack);

      throw new InternalServerErrorException('Error al crear usuario');
    }
  }

  /**
   * Obtiene todos los usuarios del sistema
   * @returns Promise con un array de todos los usuarios
   */
  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users;
  }

  /**
   * Busca un usuario por su ID
   * @param id - ID del usuario a buscar
   * @returns Promise con el usuario encontrado
   * @throws NotFoundException si el usuario no existe
   */
  async findOne(id: ObjectId): Promise<User> {
    const user = await this.findOneOrThrow(id);
    return user;
  }

  /**
   * Actualiza los datos de un usuario
   * @param id - ID del usuario a actualizar
   * @param updateUserDto - Datos a actualizar del usuario
   * @returns Promise con el usuario actualizado
   * @throws NotFoundException si el usuario no existe
   * @throws InternalServerErrorException si ocurre un error al actualizar
   */
  async update(id: ObjectId, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneOrThrow(id);

    try {
      const userWithChanges = this.userRepository.merge(user, updateUserDto);
      const updatedUser = await this.userRepository.save(userWithChanges);
      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error al actualizar usuario con id ${id.toString()}: ${err.message}`,
        err.stack,
      );

      throw new InternalServerErrorException('Error al actualizar usuario');
    }
  }

  /**
   * Elimina un usuario del sistema
   * @param id - ID del usuario a eliminar
   * @returns Promise que se resuelve cuando el usuario es eliminado
   * @throws NotFoundException si el usuario no existe
   * @throws InternalServerErrorException si ocurre un error al eliminar
   */
  async remove(id: ObjectId): Promise<void> {
    const user = await this.findOneOrThrow(id);

    try {
      await this.userRepository.delete(user._id);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error al eliminar usuario con id ${id.toString()}: ${err.message}`,
        err.stack,
      );

      throw new InternalServerErrorException('Error al eliminar usuario');
    }
  }

  /**
   * Busca un usuario por su ID y lanza una excepción si no existe
   * @param id - ID del usuario a buscar
   * @returns Promise con el usuario encontrado
   * @throws NotFoundException si el usuario no existe
   */
  async findOneOrThrow(id: ObjectId): Promise<User> {
    const user = await this.userRepository.findOneBy({ _id: id });
    if (!user) {
      throw new NotFoundException(
        `Usuario con id ${id.toString()} no encontrado`,
      );
    }
    return user;
  }

  /**
   * Busca un usuario por su email
   * @param email - Email del usuario a buscar
   * @returns Promise con el usuario encontrado o null si no existe
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user;
  }

  /**
   * Busca un usuario por su número de teléfono de WhatsApp
   * @param whatsappPhone - Número de WhatsApp del usuario a buscar
   * @returns Promise con el usuario encontrado o null si no existe
   */
  async findByWhatsappPhone(whatsappPhone: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ whatsappPhone });
    return user;
  }
}
