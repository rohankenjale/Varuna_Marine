import { PrismaClient } from '@prisma/client';
import { IPoolRepository } from '../../../core/ports/IPoolRepository';
import type { Pool } from '../../../core/domain/Pool';
import type { PoolMember } from '../../../core/domain/PoolMember';

export class PoolRepository extends IPoolRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async createPool(pool: Pool): Promise<void> {
    await this.prisma.pools.create({
      data: {
        id: pool.id,
        year: pool.year,
      }
    });
  }

  async savePoolMembers(poolId: string, members: PoolMember[]): Promise<void> {
    if (members.length === 0) return;

    await this.prisma.pool_members.createMany({
      data: members.map(m => ({
        pool_id: poolId,
        ship_id: m.shipId,
        cb_before: m.cbBefore,
        cb_after: m.cbAfter,
      }))
    });
  }
}
