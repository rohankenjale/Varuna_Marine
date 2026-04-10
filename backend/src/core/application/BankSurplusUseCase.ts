import type { BankEntry } from '../domain/BankEntry';
import { IBankingRepository } from '../ports/IBankingRepository';
import { IIdGenerator } from '../ports/IIdGenerator';

export class BankSurplusUseCase {
  constructor(
    private readonly bankingRepository: IBankingRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(shipId: string, year: number, amountToBank: number): Promise<BankEntry> {
    if (amountToBank <= 0) {
      throw new Error('amountToBank must be greater than 0.');
    }

    const entry: BankEntry = {
      id: this.idGenerator.generate(),
      shipId,
      year,
      amountGco2eq: amountToBank,
      type: 'BANKED',
    };

    await this.bankingRepository.addEntry(entry);
    return entry;
  }
}
