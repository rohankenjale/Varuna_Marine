import { IPoolGateway } from '../../core/ports/IPoolGateway';
import type { CreatePoolMemberInput, PoolResult } from '../../core/domain/Pool';
import { apiClient } from './api';

export class PoolGateway extends IPoolGateway {
  async createPool(year: number, members: CreatePoolMemberInput[]): Promise<PoolResult> {
    const response = await apiClient.post<PoolResult>('/pools', { year, members });
    return response.data;
  }
}
