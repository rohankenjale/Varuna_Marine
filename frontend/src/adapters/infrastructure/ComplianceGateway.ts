import { IComplianceGateway } from '../../core/ports/IComplianceGateway';
import type { CBResult, AdjustedCBResult } from '../../core/domain/ShipCompliance';
import { apiClient } from './api';

export class ComplianceGateway extends IComplianceGateway {
  async getCB(shipId: string, year?: number): Promise<CBResult> {
    const url = `/compliance/cb?shipId=${shipId}${year ? `&year=${year}` : ''}`;
    const response = await apiClient.get<CBResult>(url);
    return response.data;
  }

  async getAdjustedCB(shipId: string, year?: number): Promise<AdjustedCBResult> {
    const url = `/compliance/adjusted-cb?shipId=${shipId}${year ? `&year=${year}` : ''}`;
    const response = await apiClient.get<AdjustedCBResult>(url);
    return response.data;
  }
}
