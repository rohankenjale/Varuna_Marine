/**
 * BankEntry — a single banking-ledger row for one ship.
 *
 * Pure domain entity. No imports. No behavior.
 *   'BANKED'  → surplus deposited from a year of over-compliance.
 *   'APPLIED' → previously banked surplus drawn down to cover a later deficit.
 *
 * The available balance for a ship is derived by summing BANKED minus APPLIED
 * across all entries (see IBankingRepository.getBalanceByShip in Phase 3).
 */
export type BankEntryType = 'BANKED' | 'APPLIED';

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  /** Always stored as a positive magnitude; the `type` carries the sign. */
  amountGco2eq: number;
  type: BankEntryType;
}
