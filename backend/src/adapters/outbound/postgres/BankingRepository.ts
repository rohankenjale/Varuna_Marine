import { PrismaClient } from '@prisma/client';
import { IBankingRepository } from '../../../core/ports/IBankingRepository';
import type { BankEntry, BankEntryType } from '../../../core/domain/BankEntry';

export class BankingRepository extends IBankingRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async addEntry(entry: BankEntry): Promise<void> {
    await this.prisma.bank_entries.create({
      data: {
        id: entry.id,
        ship_id: entry.shipId,
        year: entry.year,
        amount_gco2eq: entry.amountGco2eq,
        type: entry.type,
      }
    });
  }

  async getBalanceByShip(shipId: string): Promise<number> {
    const result = await this.prisma.bank_entries.groupBy({
      by: ['type'],
      where: { ship_id: shipId },
      _sum: { amount_gco2eq: true }
    });

    let banked = 0;
    let applied = 0;

    for (const r of result) {
      if (r.type === 'BANKED') banked += r._sum.amount_gco2eq || 0;
      if (r.type === 'APPLIED') applied += r._sum.amount_gco2eq || 0;
    }

    return banked - applied;
  }

  async findByShip(shipId: string): Promise<BankEntry[]> {
    const records = await this.prisma.bank_entries.findMany({
      where: { ship_id: shipId },
      orderBy: { year: 'asc' }
    });

    return records.map(r => ({
      id: r.id,
      shipId: r.ship_id,
      year: r.year,
      amountGco2eq: r.amount_gco2eq,
      type: r.type as BankEntryType
    }));
  }
}
