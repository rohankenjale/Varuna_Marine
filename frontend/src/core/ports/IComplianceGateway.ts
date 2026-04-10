import type { CBResult, AdjustedCBResult } from '../domain/ShipCompliance';

export abstract class IComplianceGateway {
  abstract getCB(shipId: string, year?: number): Promise<CBResult>;
  abstract getAdjustedCB(shipId: string, year?: number): Promise<AdjustedCBResult>;
}
