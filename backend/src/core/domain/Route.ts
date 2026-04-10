/**
 * Route — a single voyage record used for FuelEU emissions comparison.
 *
 * Pure domain entity. No imports. No behavior.
 * One Route in a comparison set is flagged `isBaseline: true` and acts as the
 * reference against which the others are measured (see CompareRoutesUseCase).
 */
export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  /** Greenhouse-gas intensity of the fuel, gCO2eq / MJ. */
  ghgIntensity: number;
  /** Fuel consumed on the voyage, tonnes. */
  fuelConsumption: number;
  /** Distance travelled, nautical miles. */
  distance: number;
  /** Total emissions for the voyage, tCO2eq. */
  totalEmissions: number;
  /** True if this Route is the baseline that others are compared against. */
  isBaseline: boolean;
}
