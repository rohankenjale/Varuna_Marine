import type { Route, ComparisonResult } from '../domain/Route';

export abstract class IRoutesGateway {
  abstract getRoutes(): Promise<Route[]>;
  abstract setBaseline(id: string): Promise<void>;
  abstract getComparison(): Promise<ComparisonResult>;
}
