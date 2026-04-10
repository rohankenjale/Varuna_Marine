import { Router, type Request, type Response } from 'express';
import { IPoolRepository } from '../../../../core/ports/IPoolRepository';
import { IClock } from '../../../../core/ports/IClock';
import { CreatePoolUseCase, type CreatePoolMemberInput } from '../../../../core/application/CreatePoolUseCase';

/**
 * Inbound HTTP adapter for Pooling (FuelEU Article 21) endpoints.
 *
 * POST /pools → create a compliance pool with greedy allocation
 */
export class PoolController {
  public readonly router = Router();

  constructor(
    private readonly poolRepo: IPoolRepository,
    private readonly clock: IClock,
  ) {
    this.router.post('/', this.createPool);
  }

  // ── POST /pools  { year, members: [{ shipId, adjustedCB }] } ──────────

  private createPool = async (req: Request, res: Response): Promise<void> => {
    try {
      const { year, members } = req.body as {
        year?: number;
        members?: CreatePoolMemberInput[];
      };

      if (year == null || !Array.isArray(members)) {
        res.status(400).json({ error: 'year and members[] are required.' });
        return;
      }

      if (members.length < 2) {
        res.status(400).json({ error: 'A pool requires at least 2 members.' });
        return;
      }

      const useCase = new CreatePoolUseCase(this.poolRepo, this.clock);
      const poolId = crypto.randomUUID();

      const result = await useCase.execute({ poolId, year, members });

      res.status(201).json({
        poolId,
        year,
        members: result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  };
}
