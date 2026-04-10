import { describe, it, expect } from 'vitest';
import { ApplyBankedSurplusUseCase } from './ApplyBankedSurplusUseCase';
import type { IBankingRepository } from '../ports/IBankingRepository';
import type { IIdGenerator } from '../ports/IIdGenerator';
import type { BankEntry } from '../domain/BankEntry';

describe('ApplyBankedSurplusUseCase', () => {
  function makeSetup(availableBalance: number = 0) {
    const fakeRepo: IBankingRepository = {
      entries: [] as BankEntry[],
      async addEntry(entry: BankEntry) {
        this.entries!.push(entry);
      },
      async getBalanceByShip() {
        return availableBalance;
      },
      async findByShip() {
        return this.entries!;
      }
    };

    const fakeIdGen: IIdGenerator = {
      generate: () => 'fixed-uuid',
    };

    const useCase = new ApplyBankedSurplusUseCase(fakeRepo, fakeIdGen);

    return { useCase, fakeRepo };
  }

  it('applies banked surplus successfully when there is sufficient balance', async () => {
    const { useCase, fakeRepo } = makeSetup(10000);

    await useCase.execute('ship-123', 2025, 4000);

    const repoEntries = await fakeRepo.findByShip('ship-123');
    expect(repoEntries).toHaveLength(1);
    expect(repoEntries[0]).toEqual({
      id: 'fixed-uuid',
      shipId: 'ship-123',
      year: 2025,
      amountGco2eq: 4000,
      type: 'APPLIED',
    });
  });

  it('throws an error when trying to apply 0 or negative amount', async () => {
    const { useCase } = makeSetup(10000);

    await expect(useCase.execute('ship-123', 2025, 0)).rejects.toThrow('amountToApply must be greater than 0.');
    await expect(useCase.execute('ship-123', 2025, -100)).rejects.toThrow('amountToApply must be greater than 0.');
  });

  it('throws an error when applying more than the available balance', async () => {
    const { useCase } = makeSetup(5000);

    await expect(useCase.execute('ship-123', 2025, 6000)).rejects.toThrow('Insufficient banked balance.');
  });
});
