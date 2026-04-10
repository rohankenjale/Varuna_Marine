import { Router, type Request, type Response } from 'express';
import { IRouteRepository } from '../../../../core/ports/IRouteRepository';
import { IComplianceRepository } from '../../../../core/ports/IComplianceRepository';
import { IBankingRepository } from '../../../../core/ports/IBankingRepository';
import { CalculateCBUseCase } from '../../../../core/application/CalculateCBUseCase';

/**
 * Inbound HTTP adapter for Compliance Balance endpoints.
 *
 * GET /compliance/cb?shipId=X&year=Y          → compute & return CB for a ship
 * GET /compliance/adjusted-cb?shipId=X&year=Y → CB adjusted for banking balance
 */
export class ComplianceController {
  public readonly router = Router();

  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankingRepo: IBankingRepository,
  ) {
    this.router.get('/cb', this.getCB);
    this.router.get('/adjusted-cb', this.getAdjustedCB);
  }

  /**
   * Finds a route matching the given shipId (routeId field) and optional year.
   * Falls back to finding by internal UUID for backward compatibility.
   */
  private async findRoute(shipId: string, year?: number) {
    const allRoutes = await this.routeRepo.findAll();

    // Try to match by routeId (the human-visible ship/route identifier) + optional year
    let match = allRoutes.find(r => {
      if (r.routeId !== shipId) return false;
      if (year != null && r.year !== year) return false;
      return true;
    });

    // Fallback: try matching by internal UUID (backward compat with frontend using routeId param)
    if (!match) {
      match = allRoutes.find(r => r.id === shipId);
    }

    return match ?? null;
  }

  // ── GET /compliance/cb?shipId=X&year=Y (also accepts ?routeId=X) ──────

  private getCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = (req.query['shipId'] ?? req.query['routeId']) as string | undefined;
      const yearStr = req.query['year'] as string | undefined;
      const year = yearStr ? parseInt(yearStr, 10) : undefined;

      if (!shipId) {
        res.status(400).json({ error: 'shipId query parameter is required.' });
        return;
      }

      const route = await this.findRoute(shipId, year);
      if (!route) {
        res.json({
          routeId: shipId,
          year,
          fuelConsumption: 0,
          ghgIntensity: 0,
          target: 89.3368,
          cb: 0,
        });
        return;
      }

      const useCase = new CalculateCBUseCase();
      const cb = useCase.execute(route.fuelConsumption, route.ghgIntensity);

      // Persist the computed CB
      await this.complianceRepo.saveCB({
        shipId: route.routeId,
        year: route.year,
        cbGco2eq: cb,
      });

      res.json({
        routeId: route.routeId,
        year: route.year,
        fuelConsumption: route.fuelConsumption,
        ghgIntensity: route.ghgIntensity,
        target: 89.3368,
        cb,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  };

  // ── GET /compliance/adjusted-cb?shipId=X&year=Y (also accepts ?routeId=X) ──

  private getAdjustedCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = (req.query['shipId'] ?? req.query['routeId']) as string | undefined;
      const yearStr = req.query['year'] as string | undefined;
      const year = yearStr ? parseInt(yearStr, 10) : undefined;

      if (!shipId) {
        res.status(400).json({ error: 'shipId query parameter is required.' });
        return;
      }

      const route = await this.findRoute(shipId, year);
      const bankedBalance = await this.bankingRepo.getBalanceByShip(shipId);

      // Fetch entries to isolate past banked balance vs current year banked balance
      const entries = await this.bankingRepo.findByShip(shipId);
      const yearEntries = entries.filter(e => e.year === year);
      
      let bankedThisYear = 0;
      let appliedThisYear = 0;
      for (const e of yearEntries) {
        if (e.type === 'BANKED') bankedThisYear += e.amountGco2eq;
        if (e.type === 'APPLIED') appliedThisYear += e.amountGco2eq;
      }

      // Past banked represents the actual saved surplus entering this year
      const pastBanked = bankedBalance - bankedThisYear + appliedThisYear;

      if (!route) {
        res.json({
          routeId: shipId,
          year,
          cb: 0,
          bankedBalance,
          adjustedCB: pastBanked, // 0 + pastBanked
        });
        return;
      }

      // Compute base CB
      const useCase = new CalculateCBUseCase();
      const cb = useCase.execute(route.fuelConsumption, route.ghgIntensity);
      
      // Adjusted CB must combine Base CB + Past Banked.
      // If we used the total bankedBalance, we would double-count surplus banked this year.
      const adjustedCB = cb + pastBanked;

      res.json({
        routeId: route.routeId,
        year: route.year,
        cb,
        bankedBalance,
        adjustedCB,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  };
}
