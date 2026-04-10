import { describe, it, expect } from 'vitest';
import { CalculateCBUseCase } from './CalculateCBUseCase';

describe('CalculateCBUseCase', () => {
  const useCase = new CalculateCBUseCase();

  // Constants the use case uses internally
  const TARGET = 89.3368;
  const MJ_PER_TONNE = 41_000;

  describe('core formula: CB = (Target − actual) × fuelConsumption × 41 000', () => {
    it('returns positive CB when actual ghgIntensity is below target (surplus)', () => {
      const fuelConsumption = 1000;
      const actualGhg = 70;

      const cb = useCase.execute(fuelConsumption, actualGhg);

      const expected = (TARGET - actualGhg) * fuelConsumption * MJ_PER_TONNE;
      expect(cb).toBeCloseTo(expected);
      expect(cb).toBeGreaterThan(0);
    });

    it('returns negative CB when actual ghgIntensity is above target (deficit)', () => {
      const fuelConsumption = 500;
      const actualGhg = 100;

      const cb = useCase.execute(fuelConsumption, actualGhg);

      const expected = (TARGET - actualGhg) * fuelConsumption * MJ_PER_TONNE;
      expect(cb).toBeCloseTo(expected);
      expect(cb).toBeLessThan(0);
    });

    it('returns zero CB when actual ghgIntensity equals target exactly', () => {
      const cb = useCase.execute(1000, TARGET);

      expect(cb).toBeCloseTo(0);
    });
  });

  describe('boundary and edge cases', () => {
    it('returns zero when fuelConsumption is zero', () => {
      const cb = useCase.execute(0, 70);

      expect(cb).toBe(0);
    });

    it('handles very large fuel consumption values without overflow', () => {
      const fuelConsumption = 1_000_000;
      const actualGhg = 80;

      const cb = useCase.execute(fuelConsumption, actualGhg);

      const expected = (TARGET - actualGhg) * fuelConsumption * MJ_PER_TONNE;
      expect(cb).toBeCloseTo(expected);
    });

    it('handles zero actual ghgIntensity (maximum possible surplus)', () => {
      const fuelConsumption = 100;

      const cb = useCase.execute(fuelConsumption, 0);

      const expected = TARGET * fuelConsumption * MJ_PER_TONNE;
      expect(cb).toBeCloseTo(expected);
    });

    it('produces consistent results for known hand-calculated values', () => {
      // fuelConsumption = 2000t, actual = 95 gCO2eq/MJ
      // energyInScope = 2000 * 41000 = 82_000_000 MJ
      // CB = (89.3368 - 95) * 82_000_000 = -5.6632 * 82_000_000 = -464_382_400
      const cb = useCase.execute(2000, 95);

      expect(cb).toBeCloseTo(-464_382_400);
    });
  });
});
