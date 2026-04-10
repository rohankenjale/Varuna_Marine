import { PrismaClient } from '@prisma/client';
import { IComplianceRepository } from '../../../core/ports/IComplianceRepository';
import type { ShipCompliance } from '../../../core/domain/ShipCompliance';
import { UuidGenerator } from '../../../shared/UuidGenerator';

export class ComplianceRepository extends IComplianceRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async saveCB(compliance: ShipCompliance): Promise<void> {
    const generator = new UuidGenerator();
    
    // Upsert using the unique constraint @@unique([ship_id, year])
    await this.prisma.ship_compliance.upsert({
      where: {
        ship_id_year: {
          ship_id: compliance.shipId,
          year: compliance.year,
        }
      },
      update: {
        cb_gco2eq: compliance.cbGco2eq,
      },
      create: {
        id: generator.generate(),
        ship_id: compliance.shipId,
        year: compliance.year,
        cb_gco2eq: compliance.cbGco2eq,
      }
    });
  }

  async getCBByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    const record = await this.prisma.ship_compliance.findUnique({
      where: {
        ship_id_year: {
          ship_id: shipId,
          year,
        }
      }
    });

    if (!record) return null;
    return new ShipCompliance(record.ship_id, record.year, record.cb_gco2eq);
  }
}
