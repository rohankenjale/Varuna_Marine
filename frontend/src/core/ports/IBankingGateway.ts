import type { BankingRecords, BankResult, ApplyResult } from '../domain/BankEntry';

export abstract class IBankingGateway {
  abstract getRecords(shipId: string): Promise<BankingRecords>;
  abstract bankSurplus(shipId: string, year: number, amount: number): Promise<BankResult>;
  abstract applyBanked(shipId: string, year: number, amount: number): Promise<ApplyResult>;
}
