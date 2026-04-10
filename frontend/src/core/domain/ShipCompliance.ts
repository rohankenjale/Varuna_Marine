export interface ShipCompliance {
  shipId: string;
  year: number;
  cbGco2eq: number;
}

export interface CBResult {
  routeId: string;
  year: number;
  fuelConsumption: number;
  ghgIntensity: number;
  target: number;
  cb: number;
}

export interface AdjustedCBResult {
  routeId: string;
  year: number;
  cb: number;
  bankedBalance: number;
  adjustedCB: number;
}
