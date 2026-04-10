# FuelEU Maritime Platform

## Overview
A full-stack web application designed to help maritime operators calculate, analyze, and manage their compliance with the FuelEU Maritime regulation.

The platform provides a comprehensive suite of tools to handle baseline route comparisons, banking of surplus compliance (Article 20), and complex greedy allocation for compliance pooling (Article 21).

## Architecture Summary

Both the **Backend** and **Frontend** are divided into concentric layers to strictly isolate the Domain Business Logic from external frameworks, databases, and UI components. This adheres to the **Clean Architecture / Hexagonal (Ports & Adapters)** pattern.

1. **Domain Layer (Pure TypeScript)**: Contains the core business entities (`Route`, `ShipCompliance`, `BankEntry`, `Pool`). Zero external dependencies.
2. **Ports (Interfaces)**: Defines how the application communicates with the outside world (e.g., `IRouteRepository`, `IPoolGateway`).
3. **Application Layer (Use Cases)**: Implements the business logic (e.g., `CalculateCBUseCase`, `CreatePoolUseCase`). Depends entirely on injected Ports, completely decoupled from HTTP or database constraints.
4. **Adapters (Infrastructure/UI)**: The volatile outer layer.
   - *Backend*: Prisma ORM Repositories (Outbound), Express HTTP Controllers (Inbound).
   - *Frontend*: Axios Gateways (Outbound), React/Tailwind Components (Inbound/UI).

---

## Setup & Run Instructions

### Prerequisites
- Node.js (v20+)
- PostgreSQL database running locally (default connection string: `postgresql://postgres:postgres@localhost:5432/varuna_marine`)

### 1. Backend & Database Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Generate the Prisma client, run migrations, and execute the seed script (populates initial routes and marks the baseline):
```bash
npm run prisma:generate
npx prisma migrate dev --name init
npm run seed
```

Start the backend server on `http://localhost:3000`:
```bash
npm run dev
```

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application UI will now be available at `http://localhost:5173`.

---

## How to Execute Tests

The Backend core business logic was built using Test-Driven Development (TDD). It incorporates a suite of Vitest unit tests verifying the mathematical FuelEU formulas, pooling allocation invariants, and error handling entirely independently of Prisma or Express.

To run the pure TypeScript core tests:
```bash
cd backend
npm run test
```

---

## Sample API Requests & Responses

Below are examples of how the frontend interacts with the inbound Express adapters.

### 1. Fetch Route Comparison
**Request:**
```http
GET /routes/comparison HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
[
  {
    "routeId": "RT-001",
    "vesselType": "Container",
    "fuelType": "HFO",
    "ghgIntensity": 92.5,
    "percentDiff": 4.1,
    "compliant": false
  },
  {
    "routeId": "RT-002",
    "vesselType": "Tanker",
    "fuelType": "LNG",
    "ghgIntensity": 78.2,
    "percentDiff": -12.4,
    "compliant": true
  }
]
```

### 2. Bank Surplus Compliance (Article 20)
**Request:**
```http
POST /banking/bank HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "shipId": "IMO-1234567",
  "year": 2026,
  "amountToBank": 50000
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "shipId": "IMO-1234567",
    "cb_before": 150000,
    "banked_amount": 50000,
    "cb_after": 100000,
    "message": "Surplus successfully banked."
  }
}
```

### 3. Create Compliance Pool (Article 21)
**Request:**
```http
POST /pools HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "year": 2026,
  "members": [
    { "shipId": "IMO-111", "adjustedCB": 10000 },
    { "shipId": "IMO-222", "adjustedCB": -4000 }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "poolId": "pool-uuid-xyz",
  "allocation": [
    { "shipId": "IMO-111", "cbBefore": 10000, "cbAfter": 6000 },
    { "shipId": "IMO-222", "cbBefore": -4000, "cbAfter": 0 }
  ]
}
```