export type BankEntryType = 'BANKED' | 'APPLIED';

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  type: BankEntryType;
}

export interface BankingRecords {
  shipId: string;
  balance: number;
  entries: BankEntry[];
}

export interface BankResult {
  entry: BankEntry;
  balance: number;
}

export interface ApplyResult {
  message: string;
  balance: number;
}
