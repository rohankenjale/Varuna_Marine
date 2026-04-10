import { Router, type Request, type Response } from 'express';
import { IBankingRepository } from '../../../../core/ports/IBankingRepository';
import { IIdGenerator } from '../../../../core/ports/IIdGenerator';
import { ApplyBankedSurplusUseCase } from '../../../../core/application/ApplyBankedSurplusUseCase';
import { BankSurplusUseCase } from '../../../../core/application/BankSurplusUseCase';
import type { BankEntry } from '../../../../core/domain/BankEntry';

/**
 * Inbound HTTP adapter for Banking (FuelEU Article 20) endpoints.
 *
 * GET  /banking/records → list ledger entries for a ship
 * POST /banking/bank    → bank a surplus amount
 * POST /banking/apply   → apply banked surplus to a deficit
 */
export class BankingController {
  public readonly router = Router();

  constructor(
    private readonly bankingRepo: IBankingRepository,
    private readonly idGenerator: IIdGenerator,
  ) {
    this.router.get('/records', this.getRecords);
    this.router.post('/bank', this.bankSurplus);
    this.router.post('/apply', this.applyBanked);
  }

  // ── GET /banking/records?shipId=X ─────────────────────────────────────

  private getRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = req.query['shipId'] as string | undefined;
      if (!shipId) {
        res.status(400).json({ error: 'shipId query parameter is required.' });
        return;
      }

      const entries = await this.bankingRepo.findByShip(shipId);
      const balance = await this.bankingRepo.getBalanceByShip(shipId);

      res.json({ shipId, balance, entries });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  };

  // ── POST /banking/bank  { shipId, year, amount } ─────────────────────

  private bankSurplus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, year, amount } = req.body as {
        shipId?: string;
        year?: number;
        amount?: number;
      };

      if (!shipId || year == null || amount == null) {
        res.status(400).json({ error: 'shipId, year, and amount are required.' });
        return;
      }

      const useCase = new BankSurplusUseCase(this.bankingRepo, this.idGenerator);
      const entry = await useCase.execute(shipId, year, amount);

      const newBalance = await this.bankingRepo.getBalanceByShip(shipId);
      res.status(201).json({ entry, balance: newBalance });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  };

  // ── POST /banking/apply  { shipId, year, amount } ─────────────────────

  private applyBanked = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, year, amount } = req.body as {
        shipId?: string;
        year?: number;
        amount?: number;
      };

      if (!shipId || year == null || amount == null) {
        res.status(400).json({ error: 'shipId, year, and amount are required.' });
        return;
      }

      const useCase = new ApplyBankedSurplusUseCase(this.bankingRepo, this.idGenerator);
      await useCase.execute(shipId, year, amount);

      const newBalance = await this.bankingRepo.getBalanceByShip(shipId);
      res.json({ message: 'Banked surplus applied.', balance: newBalance });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  };
}
