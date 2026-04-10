import type { Pool } from '../domain/Pool';
import type { PoolMember } from '../domain/PoolMember';
import { IClock } from '../ports/IClock';
import { IPoolRepository } from '../ports/IPoolRepository';

export interface CreatePoolMemberInput {
  shipId: string;
  adjustedCB: number;
}

export interface CreatePoolInput {
  poolId: string;
  year: number;
  members: CreatePoolMemberInput[];
}

export class CreatePoolUseCase {
  constructor(
    private readonly poolRepository: IPoolRepository,
    private readonly clock: IClock,
  ) {}

  async execute(input: CreatePoolInput): Promise<PoolMember[]> {
    if (input.members.length === 0) {
      throw new Error('Pool must contain at least one member.');
    }

    const sumAdjustedCb = input.members.reduce((sum, member) => sum + member.adjustedCB, 0);
    if (sumAdjustedCb < 0) {
      throw new Error('Invalid pool: sum of adjustedCB must be >= 0.');
    }

    const membersByShip = new Map<string, PoolMember>();
    for (const member of input.members) {
      membersByShip.set(member.shipId, {
        shipId: member.shipId,
        cbBefore: member.adjustedCB,
        cbAfter: member.adjustedCB,
      });
    }

    const surpluses = [...membersByShip.values()]
      .filter((member) => member.cbAfter > 0)
      .sort((a, b) => b.cbAfter - a.cbAfter);

    const deficits = [...membersByShip.values()]
      .filter((member) => member.cbAfter < 0)
      .sort((a, b) => a.cbAfter - b.cbAfter);

    for (const deficit of deficits) {
      for (const surplus of surpluses) {
        if (deficit.cbAfter >= 0) {
          break;
        }
        if (surplus.cbAfter <= 0) {
          continue;
        }

        const needed = -deficit.cbAfter;
        const transferable = Math.min(needed, surplus.cbAfter);

        surplus.cbAfter -= transferable;
        deficit.cbAfter += transferable;
      }
    }

    const result = [...membersByShip.values()];
    for (const member of result) {
      if (member.cbBefore >= 0 && member.cbAfter < 0) {
        throw new Error(`Invalid allocation: surplus ship ${member.shipId} dropped below zero.`);
      }
      if (member.cbBefore < 0 && member.cbAfter < member.cbBefore) {
        throw new Error(`Invalid allocation: deficit ship ${member.shipId} became worse.`);
      }
    }

    const pool: Pool = {
      id: input.poolId,
      year: input.year,
      createdAt: this.clock.now(),
    };

    await this.poolRepository.createPool(pool);
    await this.poolRepository.savePoolMembers(input.poolId, result);

    return result;
  }
}
