import { PrismaClient } from '@prisma/client';
import { UuidGenerator } from '../../shared/UuidGenerator';

const prisma = new PrismaClient();
const uuid = new UuidGenerator();

const mockRoutes = [
  {
    id: uuid.generate(),
    route_id: 'R-001',
    year: 2024,
    ghg_intensity: 91.0,
    is_baseline: false,
    fuel_consumption: 5000,
    distance: 12000,
    total_emissions: 4500,
    vessel_type: 'Container',
    fuel_type: 'HFO',
  },
  {
    id: uuid.generate(),
    route_id: 'R-002',
    year: 2024,
    ghg_intensity: 88.0,
    is_baseline: true,
    fuel_consumption: 4800,
    distance: 11500,
    total_emissions: 4200,
    vessel_type: 'BulkCarrier',
    fuel_type: 'LNG',
  },
  {
    id: uuid.generate(),
    route_id: 'R-003',
    year: 2024,
    ghg_intensity: 93.5,
    is_baseline: false,
    fuel_consumption: 5100,
    distance: 12500,
    total_emissions: 4700,
    vessel_type: 'Tanker',
    fuel_type: 'MGO',
  },
  {
    id: uuid.generate(),
    route_id: 'R-004',
    year: 2025,
    ghg_intensity: 89.2,
    is_baseline: false,
    fuel_consumption: 4900,
    distance: 11800,
    total_emissions: 4300,
    vessel_type: 'RoRo',
    fuel_type: 'HFO',
  },
  {
    id: uuid.generate(),
    route_id: 'R-005',
    year: 2025,
    ghg_intensity: 90.5,
    is_baseline: false,
    fuel_consumption: 4950,
    distance: 11900,
    total_emissions: 4400,
    vessel_type: 'Container',
    fuel_type: 'LNG',
  },
];

async function seed() {
  console.log('🌱 Starting database seed with Prisma...');

  try {
    // Wipe all tables (order matters for foreign keys)
    await prisma.pool_members.deleteMany();
    await prisma.pools.deleteMany();
    await prisma.bank_entries.deleteMany();
    await prisma.ship_compliance.deleteMany();
    await prisma.routes.deleteMany();
    console.log('🧹 Cleared existing data.');

    // Insert new data
    await prisma.routes.createMany({
      data: mockRoutes,
    });
    console.log('✅ Inserted 5 initial routes.');
    console.log('🌱 Seeding complete!');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
