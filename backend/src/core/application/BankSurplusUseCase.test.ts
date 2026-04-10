import { describe, it, expect } from 'vitest';
import { BankSurplusUseCase } from './BankSurplusUseCase';
import type { IBankingRepository } from '../ports/IBankingRepository';
import type { IIdGenerator } from '../ports/IIdGenerator';
import type { BankEntry } from '../domain/BankEntry';

describe('BankSurplusUseCase', () => {
  function makeSetup() {
    const fakeRepo: IBankingRepository = {
      entries: [] as BankEntry[],
      async addEntry(entry: BankEntry) {
        this.entries!.push(entry);
      },
      async getBalanceByShip() {
        return 0; // not used by this usecase directly
      },
      async findByShip() {
        return this.entries!;
      }
    };

    const fakeIdGen: IIdGenerator = {
      generate: () => 'fixed-uuid',
    };

    const useCase = new BankSurplusUseCase(fakeRepo, fakeIdGen);

    return { useCase, fakeRepo };
  }

  it('banks surplus successfully with valid amount', async () => {
    const { useCase, fakeRepo } = makeSetup();

    const entry = await useCase.execute('ship-123', 2025, 5000);

    expect(entry).toEqual({
      id: 'fixed-uuid',
      shipId: 'ship-123',
      year: 2025,
      amountGco2eq: 5000,
      type: 'BANKED',
    });

    const repoEntries = await fakeRepo.findByShip('ship-123');
    expect(repoEntries).toHaveLength(1);
    expect(repoEntries[0]).toEqual(entry);
  });

  it('throws an error if amount is 0 or negative', async () => {
    const { useCase } = makeSetup();

    await expect(useCase.execute('ship-123', 2025, 0)).rejects.toThrow('amountToBank must be greater than 0.');
    await expect(useCase.execute('ship-123', 2025, -100)).rejects.toThrow('amountToBank must be greater than 0.');
  });
});
