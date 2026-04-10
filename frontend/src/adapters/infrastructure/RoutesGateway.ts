import { IRoutesGateway } from '../../core/ports/IRoutesGateway';
import type { Route, ComparisonResult } from '../../core/domain/Route';
import { apiClient } from './api';

export class RoutesGateway extends IRoutesGateway {
  async getRoutes(): Promise<Route[]> {
    const response = await apiClient.get<Route[]>('/routes');
    return response.data;
  }

  async setBaseline(id: string): Promise<void> {
    await apiClient.post(`routes/${id}/baseline`);
  }

  async getComparison(): Promise<ComparisonResult> {
    const response = await apiClient.get<ComparisonResult>('/routes/comparison');
    return response.data;
  }
}
