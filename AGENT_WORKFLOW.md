# AI Agent Workflow Log

## Agents Used

* **Antigravity IDE:** Served as the primary development environment and orchestration hub, providing deep contextual awareness, inline code completions, and seamless terminal integration for agent execution.
* **Claude Code:** Acted as the primary autonomous execution agent via CLI. It was strictly guided by the phased `task.md` roadmap to scaffold directories, write pure TypeScript tests, and generate infrastructure boilerplate.
* **CodeRabbit (Late-Stage Addition):** Introduced after the core code and Prisma adapters were generated. It was added to provide an objective, automated check that the Clean Architecture boundary remained intact. CodeRabbit was integrated through `.coderabbit.yaml` as an asynchronous architectural auditor before final submission.

## Prompts & Outputs

### Example 1: TDD and Core Logic Scaffolding (Claude Code)

To enforce Test-Driven Development and prevent the AI from rushing into implementation, the prompt was deliberately constrained to testing only.

* **Prompt:** "Execute Phase 4 of task.md. Generate the Vitest suite for `CalculateCBUseCase`. You must use pure TypeScript doubles. Do NOT write the implementation yet."
* **Generated Snippet:**

```typescript
import { describe, it, expect } from 'vitest';
import { CalculateCBUseCase } from './CalculateCBUseCase';

describe('CalculateCBUseCase', () => {
  it('should correctly calculate the Compliance Balance (CB)', () => {
    const useCase = new CalculateCBUseCase();
    const fuelConsumption = 100; // MT
    const actualGhgIntensity = 85.0; // gCO2eq/MJ

    // Energy in scope = 100 * 41000 = 4,100,000 MJ
    // Target = 89.3368
    // CB = (89.3368 - 85.0) * 4,100,000 = 17,780,880
    const cb = useCase.execute(fuelConsumption, actualGhgIntensity);

    expect(cb).toBeCloseTo(17780880, 2);
  });
});
```

### Example 2: Correcting Architectural Leakage (Prisma ORM)

During Phase 6, the backend adapters were being implemented with Prisma. Claude Code initially leaned toward coupling the database layer to the application layer.

* **Prompt:** "Execute Phase 6: Set up the database using Prisma and implement the outbound repositories."
* **Initial Output Issue:** Claude Code generated a `RouteRepository` that returned raw Prisma `@prisma/client` types directly to the application use cases, which violated the hexagonal boundary.
* **Refinement Prompt:** "Correction: you have breached the domain boundary. The `src/core/` directories must remain 100% pure TypeScript. You cannot expose Prisma types through the `IRouteRepository` port. Create a mapper function inside `src/adapters/outbound/postgres/RouteRepository.ts` that translates the Prisma `RouteRecord` into our pure domain `Route` entity before returning it."

## Validation / Corrections

Verification was primarily driven by the Vitest suites established during the TDD phase. With 31/31 unit tests passing on pure TypeScript doubles, there was a strong safety net for the FuelEU formulas and pooling logic.

Manual correction was required almost exclusively at the adapter boundaries. AI models naturally drift toward standard MVC patterns where the ORM permeates the whole app. Repeated intervention was needed to ensure Prisma clients, schemas, and migrations were confined to `src/adapters/outbound/postgres/` and `src/infrastructure/db/`. To make architectural drift easier to catch, CodeRabbit was configured to flag any PR where `adapters/` or `prisma/` were imported into `core/`.

## Observations

* **Where the agent saved time:** Claude Code was very fast at translating the verbose FuelEU Maritime formulas into test assertions. It also saved significant time when writing `schema.prisma`, setting up the Express controllers, and building the React Query hooks that connected the frontend tabs to the backend APIs.
* **Where it failed or hallucinated:** The AI struggled with inversion of control. Left unchecked, it inserted direct Prisma database calls into application use cases instead of relying on the injected `IComplianceRepository` interfaces.
* **How the tools were combined effectively:** Antigravity IDE provided the overarching context, while Claude Code handled bulk generation within the constraints of the `task.md` roadmap. Adding CodeRabbit as a separate reviewer created a stronger workflow in which the LLM generated code and a different AI reviewed architectural compliance.

## Best Practices Followed

* **Spec-Driven Orchestration:** A structured `task.md` file, inspired by the "Get Shit Done" framework, forced Claude to execute sequentially and prevented context bloat and architectural drift.
* **Strict TDD Enforcement:** The agent was required to write mathematical assertions and edge-case tests, including Article 21 greedy pooling logic, before implementing the business use cases.
* **Continuous Review via CodeRabbit:** Automated AI PR reviews were used to enforce Clean Architecture path constraints and domain purity, keeping infrastructure decoupled from business logic.

