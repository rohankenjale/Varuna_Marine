/**
 * Outbound port for reading the current wall-clock time.
 *
 * Exists so use cases can produce `createdAt` / `updatedAt` timestamps
 * without calling `new Date()` directly. That keeps the core deterministic
 * under test: Phase 5 tests can inject a fixed clock like
 *   { now: () => new Date('2026-01-01T00:00:00Z') }
 * and the real production adapter is a one-liner `{ now: () => new Date() }`.
 */
export abstract class IClock {
  abstract now(): Date;
}
