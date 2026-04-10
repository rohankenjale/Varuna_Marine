export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface CreatePoolMemberInput {
  shipId: string;
  adjustedCB: number;
}

export interface PoolResult {
  poolId: string;
  year: number;
  members: PoolMember[];
}
