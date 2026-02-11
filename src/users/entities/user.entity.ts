import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

@Entity('users')
export class User {
  @ApiProperty({ type: String, description: 'Identificador único del usuario' })
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value?.toString(), {
    toPlainOnly: true,
  })
  _id: ObjectId;

  @ApiProperty({ type: String, description: 'El nombre del usuario' })
  @Column()
  firstName: string;

  @ApiProperty({ type: String, description: 'El apellido del usuario' })
  @Column()
  lastName: string;

  @ApiProperty({
    type: String,
    description: 'El correo electrónico del usuario',
  })
  @Index({ unique: true })
  @Column()
  email: string;

  @ApiProperty({ type: String, description: 'La contraseña del usuario' })
  @Column()
  @Exclude()
  password: string;

  @ApiProperty({ type: String, description: 'El género del usuario' })
  @Column()
  gender: 'Masculino' | 'Femenino';

  @ApiProperty({
    type: String,
    description: 'La fecha de nacimiento del usuario (formato: YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @Column()
  birthday: string;

  @ApiProperty({
    type: String,
    description: 'El número de teléfono de WhatsApp del usuario',
  })
  @Index({ unique: true })
  @Column()
  whatsappPhone: string;

  @ApiProperty({ type: Date, description: 'La fecha de creación del usuario' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    description: 'La fecha de actualización del usuario',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }
}
