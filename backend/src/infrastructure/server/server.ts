import express from 'express';
import cors from 'cors';
import { prisma } from '../db/connection';
import { RouteRepository } from '../../adapters/outbound/postgres/RouteRepository';
import { ComplianceRepository } from '../../adapters/outbound/postgres/ComplianceRepository';
import { BankingRepository } from '../../adapters/outbound/postgres/BankingRepository';
import { PoolRepository } from '../../adapters/outbound/postgres/PoolRepository';
import { RoutesController } from '../../adapters/inbound/http/controllers/RoutesController';
import { ComplianceController } from '../../adapters/inbound/http/controllers/ComplianceController';
import { BankingController } from '../../adapters/inbound/http/controllers/BankingController';
import { PoolController } from '../../adapters/inbound/http/controllers/PoolController';
import { SystemClock } from '../../shared/SystemClock';
import { UuidGenerator } from '../../shared/UuidGenerator';

const app = express();

app.use(cors());
app.use(express.json());

// ── Dependency Injection ──────────────────────────────────────────────────

// 1. Instantiate the outbound adapters (Repositories pointing to Postgres + System Utils)
const routeRepo = new RouteRepository(prisma);
const complianceRepo = new ComplianceRepository(prisma);
const bankingRepo = new BankingRepository(prisma);
const poolRepo = new PoolRepository(prisma);
const systemClock = new SystemClock();
const uuidGenerator = new UuidGenerator();

// 2. Instantiate the inbound adapters (Controllers injected with dependencies)
const routesController = new RoutesController(routeRepo);
const complianceController = new ComplianceController(
  routeRepo,
  complianceRepo,
  bankingRepo
);
const bankingController = new BankingController(bankingRepo, uuidGenerator);
const poolController = new PoolController(poolRepo, systemClock);

// ── Mount Routes ──────────────────────────────────────────────────────────

app.use('/routes', routesController.router);
app.use('/compliance', complianceController.router);
app.use('/banking', bankingController.router);
app.use('/pools', poolController.router);

// ── Start Server ──────────────────────────────────────────────────────────

const PORT = process.env['PORT'] || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
