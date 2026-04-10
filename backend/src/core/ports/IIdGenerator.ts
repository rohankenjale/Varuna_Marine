/**
 * Outbound port for generating unique entity identifiers.
 *
 * Exists so use cases can mint IDs for new aggregates (BankEntry, Pool, ...)
 * without calling `crypto.randomUUID()` or `Math.random()` directly, both
 * of which are non-deterministic globals and would poison unit tests.
 *
 * Phase 5 tests inject a counter-backed fake like
 *   let n = 0; { generate: () => `id-${++n}` }
 * The real production adapter wraps `crypto.randomUUID()`.
 */
export abstract class IIdGenerator {
  abstract generate(): string;
}
