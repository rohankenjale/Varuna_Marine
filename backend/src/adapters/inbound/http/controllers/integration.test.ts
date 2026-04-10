import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BankingController } from './BankingController';
import { RoutesController } from './RoutesController';
import { ComplianceController } from './ComplianceController';
import { PoolController } from './PoolController';

// We mock the controllers' dependencies
const mockRouteRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  setBaseline: vi.fn(),
  getBaseline: vi.fn(),
};

const mockComplianceRepo = {
  saveCB: vi.fn(),
  getCBByShipAndYear: vi.fn(),
};

const mockBankingRepo = {
  addEntry: vi.fn(),
  getBalanceByShip: vi.fn(),
  findByShip: vi.fn(),
};

const mockPoolRepo = {
  createPool: vi.fn(),
  savePoolMembers: vi.fn(),
};

const mockIdGenerator = {
  generate: () => 'test-id',
};

const mockSystemClock = {
  now: () => new Date('2025-01-01T00:00:00Z')
};

// Setup Express app
const app = express();
app.use(express.json());

app.use('/routes', new RoutesController(mockRouteRepo).router);
app.use('/compliance', new ComplianceController(mockRouteRepo, mockComplianceRepo, mockBankingRepo).router);
app.use('/banking', new BankingController(mockBankingRepo, mockIdGenerator).router);
app.use('/pools', new PoolController(mockPoolRepo, mockSystemClock).router);

describe('Integration Tests - HTTP Endpoints', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /routes', () => {
    it('returns a list of routes', async () => {
      mockRouteRepo.findAll.mockResolvedValueOnce([{ id: 'r1', isBaseline: true }]);

      const res = await request(app).get('/routes');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 'r1', isBaseline: true }]);
    });
  });

  describe('POST /banking/bank', () => {
    it('banks surplus successfully', async () => {
      mockBankingRepo.addEntry.mockResolvedValueOnce(undefined);
      mockBankingRepo.getBalanceByShip.mockResolvedValueOnce(5000);

      const res = await request(app)
        .post('/banking/bank')
        .send({ shipId: 'ship1', year: 2025, amount: 5000 });

      expect(res.status).toBe(201);
      expect(res.body.balance).toBe(5000);
      expect(mockBankingRepo.addEntry).toHaveBeenCalledWith({
        id: 'test-id',
        shipId: 'ship1',
        year: 2025,
        type: 'BANKED',
        amountGco2eq: 5000,
      });
    });

    it('rejects invalid amounts', async () => {
      const res = await request(app)
        .post('/banking/bank')
        .send({ shipId: 'ship1', year: 2025, amount: -100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('amountToBank must be greater than 0.');
    });
  });

  describe('POST /banking/apply', () => {
    it('applies banked surplus successfully', async () => {
      mockBankingRepo.getBalanceByShip.mockResolvedValueOnce(10000); // For the use case check
      mockBankingRepo.addEntry.mockResolvedValueOnce(undefined);
      mockBankingRepo.getBalanceByShip.mockResolvedValueOnce(6000); // For the final return

      const res = await request(app)
        .post('/banking/apply')
        .send({ shipId: 'ship1', year: 2025, amount: 4000 });

      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(6000);
      expect(res.body.message).toBe('Banked surplus applied.');
      expect(mockBankingRepo.addEntry).toHaveBeenCalledWith({
        id: 'test-id',
        shipId: 'ship1',
        year: 2025,
        type: 'APPLIED',
        amountGco2eq: 4000,
      });
    });

    it('returns error when applying more than available balance', async () => {
      mockBankingRepo.getBalanceByShip.mockResolvedValueOnce(1000);

      const res = await request(app)
        .post('/banking/apply')
        .send({ shipId: 'ship1', year: 2025, amount: 4000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Insufficient banked balance.');
    });
  });

  describe('GET /compliance/cb', () => {
    it('computes CB for a given shipId', async () => {
      mockRouteRepo.findAll.mockResolvedValueOnce([
        { id: 'uuid-1', routeId: 'R-001', year: 2024, ghgIntensity: 85.0, fuelConsumption: 1000, vesselType: 'Container', fuelType: 'LNG' },
      ]);
      mockComplianceRepo.saveCB.mockResolvedValueOnce(undefined);

      const res = await request(app).get('/compliance/cb?shipId=R-001&year=2024');

      expect(res.status).toBe(200);
      expect(res.body.routeId).toBe('R-001');
      expect(res.body.year).toBe(2024);
      expect(res.body.target).toBe(89.3368);
      // CB = (89.3368 - 85) * 1000 * 41000 = 4.3368 * 41000000 = 177_808_800
      expect(res.body.cb).toBeCloseTo(177_808_800);
    });

    it('returns 400 when shipId is missing', async () => {
      const res = await request(app).get('/compliance/cb');
      expect(res.status).toBe(400);
    });

    it('returns 404 when ship is not found', async () => {
      mockRouteRepo.findAll.mockResolvedValueOnce([]);

      const res = await request(app).get('/compliance/cb?shipId=UNKNOWN');
      expect(res.status).toBe(404);
    });

    it('also accepts legacy routeId param', async () => {
      mockRouteRepo.findAll.mockResolvedValueOnce([
        { id: 'uuid-1', routeId: 'R-001', year: 2024, ghgIntensity: 85.0, fuelConsumption: 1000, vesselType: 'Container', fuelType: 'LNG' },
      ]);
      mockComplianceRepo.saveCB.mockResolvedValueOnce(undefined);

      const res = await request(app).get('/compliance/cb?routeId=uuid-1');

      expect(res.status).toBe(200);
      expect(res.body.routeId).toBe('R-001');
    });
  });

  describe('GET /compliance/adjusted-cb', () => {
    it('returns adjusted CB (base + banked)', async () => {
      mockRouteRepo.findAll.mockResolvedValueOnce([
        { id: 'uuid-1', routeId: 'R-001', year: 2024, ghgIntensity: 85.0, fuelConsumption: 1000, vesselType: 'Container', fuelType: 'LNG' },
      ]);
      mockBankingRepo.getBalanceByShip.mockResolvedValueOnce(50000);

      const res = await request(app).get('/compliance/adjusted-cb?shipId=R-001');

      expect(res.status).toBe(200);
      const baseCB = (89.3368 - 85.0) * 1000 * 41000;
      expect(res.body.cb).toBeCloseTo(baseCB);
      expect(res.body.bankedBalance).toBe(50000);
      expect(res.body.adjustedCB).toBeCloseTo(baseCB + 50000);
    });
  });

});
