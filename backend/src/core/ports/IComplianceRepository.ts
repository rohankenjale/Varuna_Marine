import type { ShipCompliance } from '../domain/ShipCompliance';

/**
 * Outbound port for Compliance Balance (CB) persistence.
 *
 * One ShipCompliance row per (shipId, year). `saveCB` is an upsert: if a row
 * already exists for that (shipId, year), it must be replaced — the FuelEU
 * CB for a given year is recomputed whenever inputs change.
 */
export abstract class IComplianceRepository {
  abstract saveCB(compliance: ShipCompliance): Promise<void>;
  abstract getCBByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;
}
