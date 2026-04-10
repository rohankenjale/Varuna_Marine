import type { Route } from '../domain/Route';

/**
 * Outbound port for Route persistence.
 *
 * Implemented by adapters (e.g. Postgres, in-memory). Use cases depend on
 * this interface — never on a concrete adapter — to keep the core pure.
 *
 * Invariant: at most one Route may have `isBaseline === true` at any time.
 * `setBaseline(id)` must atomically clear the previous baseline and set the
 * new one; the adapter is responsible for that atomicity.
 */
export abstract class IRouteRepository {
  abstract findAll(): Promise<Route[]>;
  abstract findById(id: string): Promise<Route | null>;
  abstract setBaseline(id: string): Promise<void>;
  abstract getBaseline(): Promise<Route | null>;
}
