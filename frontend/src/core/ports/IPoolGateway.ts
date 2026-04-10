import type { CreatePoolMemberInput, PoolResult } from '../domain/Pool';

export abstract class IPoolGateway {
  abstract createPool(year: number, members: CreatePoolMemberInput[]): Promise<PoolResult>;
}
