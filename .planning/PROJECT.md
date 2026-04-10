# Project: FuelEU Maritime Platform

## Overview
A full-stack web application designed to help maritime operators calculate, analyze, and manage their compliance with the FuelEU Maritime regulation (Articles 20 and 21).

## Architecture: Strict Hexagonal (Ports & Adapters)
Both the Backend and Frontend must adhere to concentric architectural layers.
1. **Domain Layer:** Pure TypeScript. No dependencies.
2. **Ports:** Interfaces defining outbound communication.
3. **Application Layer:** Use Cases orchestrating domain logic. Depends only on Domain and Ports.
4. **Adapters:** Infrastructure (Prisma/Postgres, Axios) and UI (Express, React/Tailwind).

## Tech Stack
- **Backend:** Node.js (v20+), TypeScript, Express, Prisma ORM, PostgreSQL, Vitest.
- **Frontend:** React, Vite, TailwindCSS, React Query, Axios, Recharts, Lucide-React.

## STRICT AI ORCHESTRATION RULES
1. **Phase Isolation:** You must pause and seek human approval after completing each major phase. Do not hallucinate future phases.
2. **Core Purity:** You are strictly forbidden from importing ORMs, web frameworks, or UI libraries into the `src/core/` directories.
3. **Test-Driven:** All core business logic in `src/core/application/` MUST be fully covered by Vitest unit tests using pure TypeScript doubles before adapter generation begins.