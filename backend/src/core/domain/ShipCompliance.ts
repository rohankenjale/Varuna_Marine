/**
 * ShipCompliance — the FuelEU Compliance Balance (CB) for one ship in one year.
 *
 * Pure domain entity. No imports. No behavior.
 * `cbGco2eq` is the signed result of (target − actual) × energyInScope:
 *   positive  = surplus (the ship is over-compliant and may bank or pool)
 *   negative  = deficit (the ship must apply banked credits, pool, or pay)
 */
export interface ShipCompliance {
  shipId: string;
  year: number;
  /** Compliance Balance, gCO2eq. Signed. */
  cbGco2eq: number;
}
