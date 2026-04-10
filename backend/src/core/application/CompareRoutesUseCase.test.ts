import { describe, it, expect } from 'vitest';
import { CompareRoutesUseCase } from './CompareRoutesUseCase';
import type { Route } from '../domain/Route';

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-1',
    routeId: 'R-001',
    vesselType: 'Tanker',
    fuelType: 'VLSFO',
    year: 2024,
    ghgIntensity: 90,
    fuelConsumption: 1000,
    distance: 5000,
    totalEmissions: 3000,
    isBaseline: false,
    ...overrides,
  };
}

describe('CompareRoutesUseCase', () => {
  const useCase = new CompareRoutesUseCase();

  describe('percentDiff calculation', () => {
    it('returns 0% diff when route matches baseline exactly', () => {
      const baseline = makeRoute({ id: 'b', ghgIntensity: 80, isBaseline: true });
      const route = makeRoute({ id: 'r', ghgIntensity: 80 });

      const [result] = useCase.execute([route], baseline);

      expect(result!.percentDiff).toBeCloseTo(0);
      expect(result!.compliant).toBe(true);
    });

    it('returns positive % when route is worse than baseline', () => {
      const baseline = makeRoute({ id: 'b', ghgIntensity: 80, isBaseline: true });
      const route = makeRoute({ id: 'r', ghgIntensity: 100 });

      const [result] = useCase.execute([route], baseline);

      // ((100 / 80) - 1) * 100 = 25%
      expect(result!.percentDiff).toBeCloseTo(25);
      expect(result!.compliant).toBe(false);
    });

    it('returns negative % when route is better than baseline', () => {
      const baseline = makeRoute({ id: 'b', ghgIntensity: 100, isBaseline: true });
      const route = makeRoute({ id: 'r', ghgIntensity: 80 });

      const [result] = useCase.execute([route], baseline);

      // ((80 / 100) - 1) * 100 = -20%
      expect(result!.percentDiff).toBeCloseTo(-20);
      expect(result!.compliant).toBe(true);
    });

    it('handles multiple routes at once', () => {
      const baseline = makeRoute({ id: 'b', ghgIntensity: 50, isBaseline: true });
      const routes = [
        makeRoute({ id: 'r1', ghgIntensity: 50 }),
        makeRoute({ id: 'r2', ghgIntensity: 75 }),
        makeRoute({ id: 'r3', ghgIntensity: 25 }),
      ];

      const results = useCase.execute(routes, baseline);

      expect(results).toHaveLength(3);
      expect(results[0]!.percentDiff).toBeCloseTo(0);
      expect(results[0]!.compliant).toBe(true);
      expect(results[1]!.percentDiff).toBeCloseTo(50);
      expect(results[1]!.compliant).toBe(false);
      expect(results[2]!.percentDiff).toBeCloseTo(-50);
      expect(results[2]!.compliant).toBe(true);
    });
  });

  describe('compliant flag', () => {
    it('marks route compliant when ghgIntensity equals baseline', () => {
      const baseline = makeRoute({ ghgIntensity: 80, isBaseline: true });
      const route = makeRoute({ ghgIntensity: 80 });

      const [result] = useCase.execute([route], baseline);

      expect(result!.compliant).toBe(true);
    });

    it('marks route non-compliant when ghgIntensity exceeds baseline', () => {
      const baseline = makeRoute({ ghgIntensity: 80, isBaseline: true });
      const route = makeRoute({ ghgIntensity: 80.01 });

      const [result] = useCase.execute([route], baseline);

      expect(result!.compliant).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('throws when baseline ghgIntensity is zero', () => {
      const baseline = makeRoute({ ghgIntensity: 0, isBaseline: true });
      const route = makeRoute({ ghgIntensity: 50 });

      expect(() => useCase.execute([route], baseline)).toThrow(
        'Baseline ghgIntensity must be non-zero.',
      );
    });

    it('returns empty array when given no routes', () => {
      const baseline = makeRoute({ ghgIntensity: 80, isBaseline: true });

      const results = useCase.execute([], baseline);

      expect(results).toEqual([]);
    });

    it('attaches the original route object in the result', () => {
      const baseline = makeRoute({ ghgIntensity: 80, isBaseline: true });
      const route = makeRoute({ id: 'keep-me', ghgIntensity: 60 });

      const [result] = useCase.execute([route], baseline);

      expect(result!.route).toBe(route);
    });
  });
});
