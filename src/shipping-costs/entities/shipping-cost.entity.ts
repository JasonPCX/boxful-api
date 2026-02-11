import { Column, Entity, Index, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('shippingCosts')
export class ShippingCost {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  @Index({ unique: true })
  dayOfWeek: number;

  @Column()
  day: string;

  @Column('decimal', { precision: 10, scale: 2 })
  shippingCost: number;
}
