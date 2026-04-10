export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface ComparedRoute {
  route: Route;
  percentDiff: number;
  compliant: boolean;
}

export interface ComparisonResult {
  baseline: Route;
  comparisons: ComparedRoute[];
}
