import type { Pool } from '../domain/Pool';
import type { PoolMember } from '../domain/PoolMember';

/**
 * Outbound port for FuelEU compliance-pool persistence.
 *
 * A Pool is created once per reporting year for a given group of ships.
 * The two writes are deliberately separate methods so the use case can
 * compute and validate the greedy allocation (CreatePoolUseCase) before
 * committing any rows. Adapters are free to implement them inside a single
 * transaction if their backing store supports it.
 */
export abstract class IPoolRepository {
  abstract createPool(pool: Pool): Promise<void>;
  abstract savePoolMembers(poolId: string, members: PoolMember[]): Promise<void>;
}
