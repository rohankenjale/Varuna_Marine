/**
 * PoolMember — one ship's participation in a Pool.
 *
 * Pure domain entity. No imports. No behavior.
 * `cbBefore` is the ship's adjusted Compliance Balance entering the pool;
 * `cbAfter`  is the result after the greedy surplus→deficit allocation
 * performed by CreatePoolUseCase (Phase 4).
 */
export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}
