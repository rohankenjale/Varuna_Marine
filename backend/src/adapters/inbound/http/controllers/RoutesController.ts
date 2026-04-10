import { Router, type Request, type Response } from 'express';
import { IRouteRepository } from '../../../../core/ports/IRouteRepository';
import { CompareRoutesUseCase } from '../../../../core/application/CompareRoutesUseCase';

/**
 * Inbound HTTP adapter for Route-related endpoints.
 *
 * GET  /routes              → list all routes
 * POST /routes/:id/baseline → set a route as the baseline
 * GET  /routes/comparison   → compare all routes against the baseline
 */
export class RoutesController {
  public readonly router = Router();

  constructor(private readonly routeRepo: IRouteRepository) {
    this.router.get('/', this.getAll);
    this.router.get('/comparison', this.getComparison);
    this.router.post('/:id/baseline', this.setBaseline);
  }

  // ── GET /routes ───────────────────────────────────────────────────────

  private getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const routes = await this.routeRepo.findAll();
      res.json(routes);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  };

  // ── POST /routes/:id/baseline ─────────────────────────────────────────

  private setBaseline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Route id is required.' });
        return;
      }

      const route = await this.routeRepo.findById(id);
      if (!route) {
        res.status(404).json({ error: `Route ${id} not found.` });
        return;
      }

      await this.routeRepo.setBaseline(id);
      res.json({ message: `Route ${id} set as baseline.` });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  };

  // ── GET /routes/comparison ────────────────────────────────────────────

  private getComparison = async (_req: Request, res: Response): Promise<void> => {
    try {
      const baseline = await this.routeRepo.getBaseline();
      if (!baseline) {
        res.status(400).json({ error: 'No baseline route has been set.' });
        return;
      }

      const allRoutes = await this.routeRepo.findAll();
      const useCase = new CompareRoutesUseCase();
      const results = useCase.execute(allRoutes, baseline);

      res.json({ baseline, comparisons: results });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  };
}
