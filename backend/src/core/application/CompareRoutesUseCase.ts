import type { Route } from '../domain/Route';

export interface ComparedRoute {
  route: Route;
  percentDiff: number;
  compliant: boolean;
}

export class CompareRoutesUseCase {
  execute(routes: Route[], baseline: Route): ComparedRoute[] {
    if (baseline.ghgIntensity === 0) {
      throw new Error('Baseline ghgIntensity must be non-zero.');
    }

    return routes.map((route) => {
      const percentDiff = ((route.ghgIntensity / baseline.ghgIntensity) - 1) * 100;

      return {
        route,
        percentDiff,
        compliant: route.ghgIntensity <= baseline.ghgIntensity,
      };
    });
  }
}
