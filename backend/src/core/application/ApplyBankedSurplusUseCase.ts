import type { BankEntry } from '../domain/BankEntry';
import { IBankingRepository } from '../ports/IBankingRepository';
import { IIdGenerator } from '../ports/IIdGenerator';

/**
 * Draw banked surplus down against a ship's ledger.
 *
 * Throws if `amountToApply` is not strictly positive or if it exceeds the
 * ship's current net balance. On success, appends an 'APPLIED' BankEntry
 * so the balance actually moves — without this, calling `execute` twice
 * with the same amount would always succeed because nothing would change
 * the underlying ledger.
 *
 * Deterministic: the BankEntry id is produced via IIdGenerator, not via
 * Date.now() / Math.random(), so unit tests can inject a fake generator
 * and assert on exact BankEntry objects.
 */
export class ApplyBankedSurplusUseCase {
  constructor(
    private readonly bankingRepository: IBankingRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(shipId: string, year: number, amountToApply: number): Promise<void> {
    if (amountToApply <= 0) {
      throw new Error('amountToApply must be greater than 0.');
    }

    const availableBalance = await this.bankingRepository.getBalanceByShip(shipId);
    if (amountToApply > availableBalance) {
      throw new Error(
        `Insufficient banked balance. Requested=${amountToApply}, available=${availableBalance}.`,
      );
    }

    const entry: BankEntry = {
      id: this.idGenerator.generate(),
      shipId,
      year,
      amountGco2eq: amountToApply,
      type: 'APPLIED',
    };

    await this.bankingRepository.addEntry(entry);
  }
}
