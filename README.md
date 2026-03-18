# Webhook Processing Platform

[![CI](https://github.com/JawadHamdan03/Weebhook/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JawadHamdan03/Weebhook/actions/workflows/ci.yml)
[![Node 20](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker Compose](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A full-stack webhook processing platform that accepts incoming webhooks, runs configurable transformation pipelines, and delivers processed payloads to registered subscribers.

## Overview

```
Incoming Webhook ──► Pipeline (transform/filter/add_fields) ──► Job Queue ──► Worker ──► Subscribers (HTTP delivery)
```

- **Webhooks** are ingested via a public endpoint keyed to a specific pipeline's `sourceKey`
- **Pipelines** define how payloads are processed (add fields, transform, filter)
- **Jobs** are created for each accepted webhook and processed asynchronously by a background worker
- **Subscribers** receive the processed payload via HTTP POST with automatic retries on failure
- **Frontend dashboard** lets you manage pipelines, subscribers, monitor jobs, and send test webhooks

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16, Drizzle ORM |
| Auth | JWT (Bearer tokens), bcrypt |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Testing | Vitest, Supertest |
| Infrastructure | Docker, Docker Compose |

---

## Project Structure

```
├── docker-compose.yml
├── API/                        # Express backend
│   ├── src/
│   │   ├── server.ts           # HTTP server entry point
│   │   ├── worker.ts           # Background job worker entry point
│   │   ├── app.ts              # Express app (routes wired)
│   │   ├── config/db/
│   │   │   ├── schema.ts       # Drizzle table definitions
│   │   │   └── dbContext.ts    # Database connection
│   │   ├── routes/             # Route definitions
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic & DB queries
│   │   ├── middleware/         # JWT auth, rate limiting
│   │   └── validators/         # Zod schemas
│   └── test/                   # Vitest + Supertest integration tests
└── frontend/                   # React frontend
    └── src/
        ├── App.tsx             # Root state container
        ├── Pages/              # DashboardPage, JobDetailsPage, LoginPage
        ├── Components/         # PipelineCard, SubscriberManager, WebhookTester, …
        └── lib/
            ├── api.ts          # All API calls and shared types
            └── storage.ts      # Token persistence
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Run with Docker Compose

```bash
docker compose up --build
```

This starts four services:

| Service | Description | URL |
|---|---|---|
| `db` | PostgreSQL 16 | `localhost:5432` |
| `init` | Applies schema and seeds demo data | — |
| `api` | Express REST API | `http://localhost:5000` |
| `worker` | Background job processor | — |
| `frontend` | React app served by nginx | `http://localhost:3000` |

Open `http://localhost:3000` to use the dashboard.

### Run Locally (without Docker)

**Requirements:** Node.js 20+, a running PostgreSQL instance.

#### API

```bash
cd API
npm install

# Set environment variables
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/webhook
export JWT_SECRET=your-secret-at-least-256-bits

# Apply schema and seed
npm run apply-schema
npm run seed

# Start API server (port 5000)
npm run dev

# Start background worker (separate terminal)
npm run worker
```

#### Frontend

```bash
cd frontend
npm install

# Optional: override API URL (defaults to http://localhost:5000)
# VITE_API_BASE_URL=http://localhost:5000

npm run dev   # starts at http://localhost:5173
```

---

## API Reference

All endpoints (except auth and webhook ingestion) require a JWT Bearer token.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive a JWT |

### Pipelines

| Method | Path | Description |
|---|---|---|
| `GET` | `/pipelines` | List all pipelines |
| `GET` | `/pipelines/:id` | Get a pipeline by ID |
| `POST` | `/pipelines` | Create a pipeline |
| `PUT` | `/pipelines/:id` | Update a pipeline |
| `DELETE` | `/pipelines/:id` | Delete a pipeline |

### Subscribers

| Method | Path | Description |
|---|---|---|
| `GET` | `/pipelines/:id/subscribers` | List subscribers for a pipeline |
| `POST` | `/pipelines/:id/subscribers` | Add a subscriber to a pipeline |
| `PUT` | `/pipelines/subscribers/:id` | Update a subscriber's target URL |
| `DELETE` | `/pipelines/subscribers/:id` | Remove a subscriber |

### Webhooks

| Method | Path | Description |
|---|---|---|
| `POST` | `/webhooks/:sourceKey` | Ingest a webhook (public, rate-limited to 100 req/min) |

### Jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/jobs` | List all jobs |
| `GET` | `/jobs/:id` | Get a job with its delivery attempts |

---

## Pipeline Action Types

Pipelines process the incoming payload using one of three action types:

### `add_fields`
Merges additional fields into the payload.
```json
{ "actionConfig": { "add": { "source": "webhook", "version": 2 } } }
```

### `transform`
Picks, renames, and uppercases fields.
```json
{
  "actionConfig": {
    "pick": ["name", "email"],
    "rename": { "name": "fullName" },
    "uppercase": ["email"]
  }
}
```

### `filter`
Drops the job (no delivery) if the condition is not met.
```json
{ "actionConfig": { "field": "type", "equals": "order.created" } }
```

---

## Database Schema

```
users             — registered accounts (email + hashed password)
pipelines         — named pipelines with source key, action type, and config
subscribers       — target URLs registered per pipeline
jobs              — one job per accepted webhook (pending → processing → completed/failed)
delivery_attempts — one row per subscriber per delivery attempt, with retry scheduling
```

---

## Running Tests

```bash
cd API
npm test
```

57 tests across 8 test files covering auth, pipelines, subscribers, jobs, webhook ingestion, rate limiting, validation, and processing logic.

---

## Environment Variables

### API

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs (min 256 bits recommended) |
| `PORT` | No | `5000` | Port the API listens on |

### Frontend (build-time)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Base URL for API requests |
