import type { BankEntry } from '../domain/BankEntry';

/**
 * Outbound port for the FuelEU banking ledger.
 *
 * The ledger is append-only: every BANKED deposit and every APPLIED draw-down
 * is one row. The current balance for a ship is therefore a derived quantity:
 *   balance = sum(amount where type='BANKED') − sum(amount where type='APPLIED')
 * Adapters may compute this with a SQL aggregate or any equivalent technique.
 */
export abstract class IBankingRepository {
  abstract addEntry(entry: BankEntry): Promise<void>;
  abstract getBalanceByShip(shipId: string): Promise<number>;
  abstract findByShip(shipId: string): Promise<BankEntry[]>;
}
