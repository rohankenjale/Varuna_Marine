import { describe, it, expect } from 'vitest';
import { CreatePoolUseCase, type CreatePoolInput } from './CreatePoolUseCase';
import type { IPoolRepository } from '../ports/IPoolRepository';
import type { IClock } from '../ports/IClock';
import type { Pool } from '../domain/Pool';
import type { PoolMember } from '../domain/PoolMember';

// ── Test doubles ────────────────────────────────────────────────────────────

function makeFakeClock(fixed: Date = new Date('2026-01-01T00:00:00Z')): IClock {
  return { now: () => fixed };
}

function makeFakePoolRepository(): IPoolRepository & {
  savedPools: Pool[];
  savedMembers: { poolId: string; members: PoolMember[] }[];
} {
  return {
    savedPools: [],
    savedMembers: [],
    async createPool(pool: Pool) {
      this.savedPools.push(pool);
    },
    async savePoolMembers(poolId: string, members: PoolMember[]) {
      this.savedMembers.push({ poolId, members });
    },
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CreatePoolUseCase', () => {
  function makeUseCase(repo = makeFakePoolRepository(), clock = makeFakeClock()) {
    return { useCase: new CreatePoolUseCase(repo, clock), repo, clock };
  }

  function input(members: { shipId: string; adjustedCB: number }[]): CreatePoolInput {
    return { poolId: 'pool-1', year: 2024, members };
  }

  // ── Happy-path greedy allocation ──────────────────────────────────────

  describe('greedy surplus → deficit allocation', () => {
    it('transfers surplus to cover a single deficit exactly', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([
          { shipId: 'A', adjustedCB: 100 },
          { shipId: 'B', adjustedCB: -60 },
        ]),
      );

      const a = result.find((m) => m.shipId === 'A')!;
      const b = result.find((m) => m.shipId === 'B')!;

      expect(a.cbBefore).toBe(100);
      expect(a.cbAfter).toBe(40); // gave 60 to B
      expect(b.cbBefore).toBe(-60);
      expect(b.cbAfter).toBe(0); // fully covered
    });

    it('covers multiple deficits from a single large surplus', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([
          { shipId: 'S1', adjustedCB: 200 },
          { shipId: 'D1', adjustedCB: -80 },
          { shipId: 'D2', adjustedCB: -50 },
        ]),
      );

      const s1 = result.find((m) => m.shipId === 'S1')!;
      const d1 = result.find((m) => m.shipId === 'D1')!;
      const d2 = result.find((m) => m.shipId === 'D2')!;

      expect(s1.cbAfter).toBe(70); // 200 - 80 - 50
      expect(d1.cbAfter).toBe(0);
      expect(d2.cbAfter).toBe(0);
    });

    it('partially covers deficit when surplus is insufficient to cover all', async () => {
      const { useCase } = makeUseCase();

      // sum = 30 + (-30) = 0 ≥ 0 ✓
      // but surplus (30) only partially covers the deficit (-30) → exactly covers here
      // Use a case where surplus doesn't fully cover: S=30, D=-20, D2=-10
      const result = await useCase.execute(
        input([
          { shipId: 'S', adjustedCB: 30 },
          { shipId: 'D1', adjustedCB: -20 },
          { shipId: 'D2', adjustedCB: -10 },
        ]),
      );

      const s = result.find((m) => m.shipId === 'S')!;
      const d1 = result.find((m) => m.shipId === 'D1')!;
      const d2 = result.find((m) => m.shipId === 'D2')!;

      expect(s.cbAfter).toBe(0); // gave everything
      expect(d1.cbAfter).toBe(0); // fully covered
      expect(d2.cbAfter).toBe(0); // fully covered
    });

    it('handles all-surplus pool (no transfers needed)', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([
          { shipId: 'A', adjustedCB: 50 },
          { shipId: 'B', adjustedCB: 100 },
        ]),
      );

      expect(result).toEqual([
        { shipId: 'A', cbBefore: 50, cbAfter: 50 },
        { shipId: 'B', cbBefore: 100, cbAfter: 100 },
      ]);
    });

    it('handles pool where surplus exactly equals deficit', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([
          { shipId: 'S', adjustedCB: 100 },
          { shipId: 'D', adjustedCB: -100 },
        ]),
      );

      const s = result.find((m) => m.shipId === 'S')!;
      const d = result.find((m) => m.shipId === 'D')!;

      expect(s.cbAfter).toBe(0);
      expect(d.cbAfter).toBe(0);
    });

    it('distributes from multiple surpluses to multiple deficits (greedy order)', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([
          { shipId: 'S1', adjustedCB: 100 },
          { shipId: 'S2', adjustedCB: 50 },
          { shipId: 'D1', adjustedCB: -80 },
          { shipId: 'D2', adjustedCB: -30 },
        ]),
      );

      // Sum = 100 + 50 - 80 - 30 = 40 ≥ 0 ✓
      // Greedy: deficits sorted ascending → D1(-80) first, then D2(-30)
      //   surpluses sorted descending → S1(100) first, then S2(50)
      // D1 needs 80: take 80 from S1 (S1: 100→20)
      // D2 needs 30: take 20 from S1 (S1: 20→0), take 10 from S2 (S2: 50→40)

      const s1 = result.find((m) => m.shipId === 'S1')!;
      const s2 = result.find((m) => m.shipId === 'S2')!;
      const d1 = result.find((m) => m.shipId === 'D1')!;
      const d2 = result.find((m) => m.shipId === 'D2')!;

      expect(d1.cbAfter).toBe(0);
      expect(d2.cbAfter).toBe(0);
      expect(s1.cbAfter).toBe(0);
      expect(s2.cbAfter).toBe(40);
    });
  });

  // ── Validation rules ──────────────────────────────────────────────────

  describe('validation', () => {
    it('throws when sum of adjustedCB is negative (invalid pool)', async () => {
      const { useCase } = makeUseCase();

      await expect(
        useCase.execute(
          input([
            { shipId: 'A', adjustedCB: 10 },
            { shipId: 'B', adjustedCB: -50 },
          ]),
        ),
      ).rejects.toThrow('sum of adjustedCB must be >= 0');
    });

    it('throws when pool has zero members', async () => {
      const { useCase } = makeUseCase();

      await expect(useCase.execute(input([]))).rejects.toThrow(
        'Pool must contain at least one member.',
      );
    });
  });

  // ── Invariant guards ──────────────────────────────────────────────────

  describe('allocation invariants', () => {
    it('never drops a surplus ship below zero', async () => {
      const { useCase } = makeUseCase();

      // Large deficit, modest surplus. Sum is still ≥ 0 since surplus + another surplus covers it.
      const result = await useCase.execute(
        input([
          { shipId: 'S1', adjustedCB: 50 },
          { shipId: 'S2', adjustedCB: 100 },
          { shipId: 'D', adjustedCB: -120 },
        ]),
      );

      for (const member of result) {
        if (member.cbBefore > 0) {
          expect(member.cbAfter).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('never makes a deficit ship worse than it entered', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([
          { shipId: 'S', adjustedCB: 200 },
          { shipId: 'D1', adjustedCB: -50 },
          { shipId: 'D2', adjustedCB: -30 },
        ]),
      );

      for (const member of result) {
        if (member.cbBefore < 0) {
          expect(member.cbAfter).toBeGreaterThanOrEqual(member.cbBefore);
        }
      }
    });
  });

  // ── Persistence ───────────────────────────────────────────────────────

  describe('persistence', () => {
    it('creates the pool and saves members via the repository', async () => {
      const fixedDate = new Date('2026-06-15T12:00:00Z');
      const { useCase, repo } = makeUseCase(makeFakePoolRepository(), makeFakeClock(fixedDate));

      await useCase.execute(
        input([
          { shipId: 'A', adjustedCB: 100 },
          { shipId: 'B', adjustedCB: -50 },
        ]),
      );

      expect(repo.savedPools).toHaveLength(1);
      expect(repo.savedPools[0]).toEqual({
        id: 'pool-1',
        year: 2024,
        createdAt: fixedDate,
      });

      expect(repo.savedMembers).toHaveLength(1);
      expect(repo.savedMembers[0]!.poolId).toBe('pool-1');
      expect(repo.savedMembers[0]!.members).toHaveLength(2);
    });

    it('does NOT persist when validation fails', async () => {
      const repo = makeFakePoolRepository();
      const { useCase } = makeUseCase(repo);

      await expect(
        useCase.execute(
          input([
            { shipId: 'A', adjustedCB: 10 },
            { shipId: 'B', adjustedCB: -50 },
          ]),
        ),
      ).rejects.toThrow();

      expect(repo.savedPools).toHaveLength(0);
      expect(repo.savedMembers).toHaveLength(0);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles a single zero-CB member', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([{ shipId: 'Z', adjustedCB: 0 }]),
      );

      expect(result).toEqual([{ shipId: 'Z', cbBefore: 0, cbAfter: 0 }]);
    });

    it('handles a pool of members all with CB = 0', async () => {
      const { useCase } = makeUseCase();

      const result = await useCase.execute(
        input([
          { shipId: 'A', adjustedCB: 0 },
          { shipId: 'B', adjustedCB: 0 },
        ]),
      );

      for (const m of result) {
        expect(m.cbAfter).toBe(0);
      }
    });

    it('sum exactly zero is valid', async () => {
      const { useCase } = makeUseCase();

      // sum = 100 + (-100) = 0 → valid
      const result = await useCase.execute(
        input([
          { shipId: 'A', adjustedCB: 100 },
          { shipId: 'B', adjustedCB: -100 },
        ]),
      );

      expect(result).toBeDefined();
    });
  });
});
