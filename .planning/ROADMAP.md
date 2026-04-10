# FuelEU Maritime Platform - Scaffolding & Core Domain Task List

## INSTRUCTIONS FOR Agent
You are acting as a strict Clean Architecture (Hexagonal/Ports & Adapters) expert. 
1. Execute these tasks sequentially. Do not skip ahead.
2. **STRICT RULE:** When building the `core/` directories, you are forbidden from importing ORMs (Prisma, TypeORM, Kysely), web frameworks (Express, React), or UI libraries. The core must be 100% pure TypeScript.
3. After completing a major phase, pause and summarize what you built for my review before proceeding.
4. **REVIEW PROTOCOL:** After Phase 5 (Core Logic) and Phase 6 (Backend Adapters), you must commit and pause. I will trigger a CodeRabbit AI review on the Pull Request to ensure no Hexagonal Architecture boundaries were breached before we proceed to the Frontend.

---

## Phase 1: Directory Scaffolding & Setup

- [ ] Initialize two separate TypeScript projects: `./backend` (Node.js) and `./frontend` (Vite/React).
- [ ] In `./backend`, create the strict Hexagonal folder structure:
  - `src/core/domain`
  - `src/core/application`
  - `src/core/ports`
  - `src/adapters/inbound/http`
  - `src/adapters/outbound/postgres`
  - `src/infrastructure/db`
  - `src/infrastructure/server`
  - `src/shared`
- [ ] In `./frontend`, create the frontend Hexagonal structure:
  - `src/core/domain`
  - `src/core/application`
  - `src/core/ports`
  - `src/adapters/ui`
  - `src/adapters/infrastructure`
  - `src/shared`
- [ ] Install base dependencies for `backend`: `typescript`, `vitest` (for tests). Do NOT install Express or DB libraries yet.

---

## Phase 2: Backend Domain Entities (Pure TS)

Navigate to `backend/src/core/domain/` and create the following entities (classes or types). Ensure strict typing.

- [ ] `Route.ts`: Define properties `id`, `routeId`, `vesselType`, `fuelType`, `year`, `ghgIntensity`, `fuelConsumption`, `distance`, `totalEmissions`, `isBaseline`.
- [ ] `ShipCompliance.ts`: Define properties `shipId`, `year`, `cbGco2eq`.
- [ ] `BankEntry.ts`: Define properties `id`, `shipId`, `year`, `amountGco2eq`, `type` ('BANKED' | 'APPLIED').
- [ ] `Pool.ts` & `PoolMember.ts`: Define `Pool` (`id`, `year`, `createdAt`) and `PoolMember` (`shipId`, `cbBefore`, `cbAfter`).

---

## Phase 3: Backend Ports (Interfaces)

Navigate to `backend/src/core/ports/` and define the outbound interfaces (Repositories) that our adapters will eventually implement.

- [ ] `IRouteRepository.ts`: Methods for `findAll()`, `findById()`, `setBaseline(id)`, `getBaseline()`.
- [ ] `IComplianceRepository.ts`: Methods for `saveCB()`, `getCBByShipAndYear()`.
- [ ] `IBankingRepository.ts`: Methods for `addEntry()`, `getBalanceByShip()`.
- [ ] `IPoolRepository.ts`: Methods for `createPool()`, `savePoolMembers()`.

---

## Phase 4: Test-Driven Development (TDD) of Core Use Cases

Before writing the implementation, navigate to `backend/src/core/application/` and generate unit tests using `vitest` for the following Use Cases based on the Ports defined in Phase 3. 
- [ ] `CompareRoutesUseCase.test.ts`
- [ ] `CalculateCBUseCase.test.ts`
- [ ] `ApplyBankedSurplusUseCase.test.ts`
- [ ] `CreatePoolUseCase.test.ts` (Ensure edge cases like Negative CB and Invalid Pools are covered).
- **RULE:** These tests must use pure TypeScript mocks/doubles for the Repositories.

---

## Phase 5: Core Business Logic Implementation

Now, implement the actual Use Cases to make the tests from Phase 4 pass. These must rely ONLY on the ports defined above, injecting them via constructors.

- [ ] **Calculate Route Comparison:**
  - Create `CompareRoutesUseCase.ts`.
  - Input: Array of `Route` objects, and the baseline `Route`.
  - Logic: Apply formula `percentDiff = ((comparison / baseline) − 1) × 100`.
  - Return: Array of objects containing the route data, `percentDiff`, and `compliant` flag (true if <= baseline).
- [ ] **Calculate Compliance Balance (CB):**
  - Create `CalculateCBUseCase.ts`.
  - Formulas: 
    - `Energy in scope (MJ) = fuelConsumption * 41000`
    - `Target = 89.3368`
    - `CB = (Target - Actual ghgIntensity) * Energy in scope`
  - Return: The calculated CB value.
- [ ] **Banking Application Logic:**
  - Create `ApplyBankedSurplusUseCase.ts`.
  - Logic: Accept `shipId`, `year`, and `amountToApply`. Throw an error if `amountToApply` is greater than the available banked balance (fetched via `IBankingRepository`).
- [ ] **Pooling Allocation Logic (Greedy):**
  - Create `CreatePoolUseCase.ts`.
  - Input: Array of members with their current `adjustedCB`.
  - Logic rules to implement:
    1. Verify `Sum(adjustedCB) >= 0`. Throw error if invalid.
    2. Sort surplus ships descending (highest surplus first).
    3. Sort deficit ships ascending (highest deficit first).
    4. Transfer surplus to deficits iteratively. 
    5. Ensure no surplus ship drops below 0. 
    6. Ensure no deficit ship exits worse than it entered.
  - Return: Array of mapped `PoolMember` objects with calculated `cbAfter`.

---

## Phase 6: Backend Infrastructure & Adapters

- [ ] **Step 6.1: Database Setup (`infrastructure/db`)**
  - Install necessary database packages (e.g., `pg`, `drizzle-orm` or whatever lightweight query builder is preferred).
  - Create the database schema definition matching the prompt requirements.
  - Create a seed script (`seed.ts`) to populate the 5 initial routes with one marked as `is_baseline = true`.

- [ ] **Step 6.2: Outbound Adapters (`adapters/outbound/postgres`)**
  - Implement `RouteRepository.ts` adhering strictly to the `IRouteRepository` interface.
  - Implement `ComplianceRepository.ts` adhering to `IComplianceRepository`.
  - Implement `BankingRepository.ts` adhering to `IBankingRepository`.
  - Implement `PoolRepository.ts` adhering to `IPoolRepository`.
  - Ensure these repositories map database rows back to the pure TypeScript Domain Entities created in Phase 2.

- [ ] **Step 6.3: Inbound Adapters (`adapters/inbound/http/controllers`)**
  - Install `express`, `@types/express`, and `cors`.
  - Create controller files to handle the HTTP logic.
  - `RoutesController.ts`: Handle `GET /routes`, `POST /routes/:id/baseline`, `GET /routes/comparison`.
  - `ComplianceController.ts`: Handle `GET /compliance/cb`, `GET /compliance/adjusted-cb`.
  - `BankingController.ts`: Handle `GET /banking/records`, `POST /banking/bank`, `POST /banking/apply`.
  - `PoolController.ts`: Handle `POST /pools`.

- [ ] **Step 6.4: Server Assembly (`infrastructure/server`)**
  - Create `server.ts` or `app.ts`.
  - Configure Express middleware (JSON parsing, CORS).
  - Wire up the Express routes to the controller methods.

---

## Phase 7: Frontend UI & Integration (React + Tailwind)

- [ ] **Step 7.1: Frontend Core & Adapters Setup**
  - In `./frontend`, install `axios`, `@tanstack/react-query`, `recharts` (for the Compare chart), and `lucide-react` (for icons).
  - Copy or recreate the Pure TS Domain Entities from the backend into `frontend/src/core/domain/`.
  - Create Outbound Ports in `frontend/src/core/ports/`: `IRoutesGateway.ts`, `IComplianceGateway.ts`, `IBankingGateway.ts`, `IPoolGateway.ts`.
  - Create the Infrastructure Adapters in `frontend/src/adapters/infrastructure/`: Implement the gateways using `axios` pointing to `http://localhost:3000`.

- [ ] **Step 7.2: Base Layout & Navigation**
  - Set up standard Tailwind configuration.
  - Create a main `DashboardLayout.tsx` in `src/adapters/ui/components/`.
  - Implement a top or side navigation bar to switch between four routes: `/routes`, `/compare`, `/banking`, `/pooling`.

- [ ] **Step 7.3: Routes Tab**
  - Create custom hook `useRoutes.ts` (Application layer) using React Query to fetch data via `IRoutesGateway`.
  - Create UI: A data table displaying all routes (routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions).
  - Add filters for `vesselType`, `fuelType`, and `year`.
  - Add a "Set Baseline" button on each row that triggers a mutation to `POST /routes/:id/baseline` and invalidates the query.

- [ ] **Step 7.4: Compare Tab**
  - Create UI: Fetch comparison data from `/routes/comparison`.
  - Display the fixed Target (89.3368 gCO₂e/MJ).
  - Display a Table comparing baseline vs comparison routes showing `ghgIntensity`, `% difference` (calculated via formula), and a `compliant` indicator.
  - Integrate `recharts` to render a Bar Chart comparing `ghgIntensity` values across the routes.

- [ ] **Step 7.5: Banking Tab**
  - Create UI: Implement Fuel EU Article 20.
  - Add inputs to select a `shipId` and `year`.
  - Display current Compliance Balance (CB).
  - Create two forms:
    1. **Bank Surplus:** Input amount to bank (Disabled if CB <= 0). Calls `POST /banking/bank`.
    2. **Apply Banked:** Input amount to apply to deficit. Calls `POST /banking/apply`.
  - Display KPI cards: `cb_before`, `applied`, `cb_after`. Show API errors nicely in the UI.

- [ ] **Step 7.6: Pooling Tab**
  - Create UI: Implement Fuel EU Article 21.
  - Display a table of available ships and their `adjustedCB` for a given year.
  - Allow user to select multiple ships to form a pool.
  - Show a live "Pool Sum" indicator. Make it turn red if `Sum < 0`, and green if `Sum >= 0`.
  - Add a "Create Pool" button (Disabled if Sum < 0 or less than 2 ships selected).
  - On success, display the greedy allocation results (`cb_before` and `cb_after` per member).

---

## Testing Checklist
- [ ] **Unit** — ComputeComparison, ComputeCB, BankSurplus, ApplyBanked, CreatePool
- [ ] **Integration** — HTTP endpoints via Supertest (`integration.test.ts`)
- [ ] **Data** — Migrations + Seeds load correctly (Prisma Schema update and manual seed verification)
- [ ] **Edge cases** — Negative CB, over-apply bank, invalid pool (Enforced inside `Vitest` isolated suites)

---

## Phase 8: Documentation Assembly

- [ ] **Step 8.1: README.md**
  - Generate a comprehensive `README.md` in the project root.
  - Include: Project Overview, setup & run instructions (`npm run dev`, database seed commands), how to run tests, and a text-based architecture summary explaining the Ports & Adapters approach.

- [ ] **Step 8.2: Scaffold Deliverable Docs**
  - Create empty files `AGENT_WORKFLOW.md` and `REFLECTION.md` in the root for the developer to fill out manually based on their logs.