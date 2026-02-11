import { DataSource } from 'typeorm';

import dataSource from '../datasource';
import { ShippingCost } from '../../shipping-costs/entities/shipping-cost.entity';

const shippingCosts = [
  { dayOfWeek: 0, day: 'Domingo', shippingCost: 1.0 },
  { dayOfWeek: 1, day: 'Lunes', shippingCost: 0.5 },
  { dayOfWeek: 2, day: 'Martes', shippingCost: 0.7 },
  { dayOfWeek: 3, day: 'Miércoles', shippingCost: 0.9 },
  { dayOfWeek: 4, day: 'Jueves', shippingCost: 1.25 },
  { dayOfWeek: 5, day: 'Viernes', shippingCost: 1.35 },
  { dayOfWeek: 6, day: 'Sábado', shippingCost: 1.4 },
];

async function seedShippingCosts(dataSource: DataSource) {
  await dataSource.manager.delete(ShippingCost, {});
  await dataSource.manager.insert(ShippingCost, shippingCosts);
  console.log(
    `Se han insertado ${shippingCosts.length} costos de envíos correctamente.`,
  );
}

async function seed() {
  try {
    await dataSource.initialize();
    await seedShippingCosts(dataSource);
  } catch (error: unknown) {
    console.error('Error al ejecutar el seeder:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch(console.error);
