import { IBankingGateway } from '../../core/ports/IBankingGateway';
import type { BankingRecords, BankResult, ApplyResult } from '../../core/domain/BankEntry';
import { apiClient } from './api';

export class BankingGateway extends IBankingGateway {
  async getRecords(shipId: string): Promise<BankingRecords> {
    const response = await apiClient.get<BankingRecords>(`/banking/records?shipId=${shipId}`);
    return response.data;
  }

  async bankSurplus(shipId: string, year: number, amount: number): Promise<BankResult> {
    const response = await apiClient.post<BankResult>('/banking/bank', { shipId, year, amount });
    return response.data;
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<ApplyResult> {
    const response = await apiClient.post<ApplyResult>('/banking/apply', { shipId, year, amount });
    return response.data;
  }
}
