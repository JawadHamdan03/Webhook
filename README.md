# Webhook Processing Platform

[![CI](https://github.com/JawadHamdan03/Weebhook/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JawadHamdan03/Weebhook/actions/workflows/ci.yml)
[![Node 20](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker Compose](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A full-stack webhook processing platform that receives external webhook events, applies pipeline-based processing rules, and delivers processed payloads to subscriber endpoints with retry support.

## Table of Contents

1. [What This Project Solves](#what-this-project-solves)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Design Decisions](#design-decisions)
5. [Project Structure](#project-structure)
6. [Setup](#setup)
7. [Usage Walkthrough](#usage-walkthrough)
8. [API Reference](#api-reference)
9. [Pipeline Actions](#pipeline-actions)
10. [Data Model](#data-model)
11. [Quality and Testing](#quality-and-testing)
12. [Operations and Troubleshooting](#operations-and-troubleshooting)
13. [Known Limitations and Next Improvements](#known-limitations-and-next-improvements)

## What This Project Solves

This project provides an internal webhook processing backbone where you can:

- Accept incoming events from external systems using a unique pipeline key
- Transform, filter, sanitize, or enrich payloads using configurable actions
- Persist each webhook as a job for traceability
- Deliver processed payloads to one or more subscribers per pipeline
- Retry failed deliveries automatically with backoff
- Observe job and delivery progress in a frontend dashboard

## Core Features

- User authentication with JWT (register/login)
- Pipeline CRUD with configurable processing actions
- Subscriber CRUD per pipeline
- Public webhook ingestion endpoint with rate limiting
- Asynchronous worker-based processing and delivery
- Delivery attempts tracked per subscriber
- Automatic retry scheduling for failed deliveries
- Dashboard with:
  - Pipeline management
  - Subscriber management
  - Test webhook sender
  - Job list and filters
  - Job details with delivery attempts grouped by subscriber
  - Live polling for in-progress jobs

## Architecture

High-level event flow:

```text
Webhook Sender
   |
   v
POST /webhooks/:sourceKey
   |
   v
Create job (status: pending)
   |
   v
Worker loop claims job -> status: processing
   |
   v
runProcessing(actionType, actionConfig, payload)
   |
   v
Job completed + create initial delivery attempts
   |
   v
Worker loop claims pending delivery attempts
   |
   +--> Success: mark success
   |
   +--> Failure: mark failed + schedule retry (up to max attempts)
```

Runtime components:

- API service: REST endpoints, validation, persistence
- Worker service: background claim/process/deliver loops
- PostgreSQL: source of truth for users, pipelines, jobs, subscribers, attempts
- Frontend: operator UI for setup and observability

## Design Decisions

### 1) Asynchronous job processing instead of inline delivery

Reason:
- Keeps webhook ingestion fast and predictable
- Isolates sender experience from downstream subscriber slowness/failures

Tradeoff:
- Event delivery is eventually consistent, not immediate

### 2) Database-backed work claiming with locking semantics

Current approach:
- Worker claims jobs and delivery attempts using `FOR UPDATE SKIP LOCKED`

Reason:
- Prevents duplicate processing in concurrent worker scenarios
- Supports horizontal scaling later without major redesign

### 3) Delivery attempts as immutable history rows

Current approach:
- Each retry creates a new `delivery_attempts` row with incremented `attemptNumber`

Reason:
- Full audit trail of every attempt
- Better debugging of partial failures

Tradeoff:
- More rows over time; retention strategy may be needed for long-lived systems

### 4) Retry with bounded backoff

Current values:
- Retry delays: 10s, 30s, 60s
- Max attempts: 4 total (initial + 3 retries)

Reason:
- Improves reliability without infinite retry storms
- Easy to reason about during troubleshooting

### 5) Source-key based webhook ingestion

Reason:
- Enables one public endpoint pattern with routing by pipeline key
- Decouples sender identity from authentication in this stage

Risk consideration:
- Source key functions like a secret route token. Rotate if leaked.

### 6) Strict validation with Zod at API boundary

Reason:
- Prevents invalid configs from reaching worker runtime
- Keeps action behavior deterministic

### 7) Frontend as a control and observability plane

Reason:
- You can manage pipelines/subscribers and watch live processing status
- Reduces operational friction during integration/testing

## Project Structure

```text
.
|-- docker-compose.yml
|-- README.md
|-- API/
|   |-- Dockerfile
|   |-- package.json
|   |-- src/
|   |   |-- app.ts
|   |   |-- server.ts
|   |   |-- worker.ts
|   |   |-- config/db/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- validators/
|   |-- test/
|-- frontend/
|   |-- Dockerfile
|   |-- package.json
|   |-- src/
|   |   |-- App.tsx
|   |   |-- Components/
|   |   |-- Pages/
|   |   |-- lib/
```

## Setup

### Option A: Docker Compose (recommended)

Prerequisite:
- Docker Desktop running

Start:

```bash
docker compose up --build
```

Services exposed:

- Frontend: http://localhost:3000
- API: http://localhost:5000
- Postgres: localhost:5432

Compose services:

- `db`: PostgreSQL 16
- `init`: waits for DB, applies schema, seeds data, exits
- `api`: REST API server
- `worker`: background processor and delivery engine
- `frontend`: production-built static React app served by nginx

Stop:

```bash
docker compose down
```

### Option B: Local development without Docker

Prerequisites:

- Node.js 20+
- PostgreSQL running locally

#### API local setup

```bash
cd API
npm install
```

Set environment variables:

PowerShell:

```powershell
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/webhook"
$env:JWT_SECRET = "replace-with-a-long-random-secret"
$env:PORT = "5000"
```

Bash:

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/webhook"
export JWT_SECRET="replace-with-a-long-random-secret"
export PORT="5000"
```

Apply schema and seed:

```bash
npm run apply-schema
npm run seed
```

Run API and worker (separate terminals):

```bash
npm run dev
npm run worker
```

#### Frontend local setup

```bash
cd frontend
npm install
```

Optional API target:

PowerShell:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:5000"
```

Bash:

```bash
export VITE_API_BASE_URL="http://localhost:5000"
```

Run dev server:

```bash
npm run dev
```

## Usage Walkthrough

### 1) Register and login

- Open frontend
- Create an account
- Login to obtain authenticated dashboard access

### 2) Create a pipeline

Choose:
- Name
- Action type
- Action config

A unique `sourceKey` is generated if not provided.

### 3) Add subscribers to the pipeline

For each destination endpoint, add target URL in Subscriber Manager.

### 4) Send a test webhook

Use the dashboard webhook tester:
- Select pipeline source key
- Provide JSON payload
- Submit

You receive an accepted response with `jobId`.

### 5) Observe job and deliveries

- Open job details
- Track status transitions (`pending -> processing -> completed/failed`)
- Review delivery attempts grouped by subscriber
- Watch live updates while processing is active

## API Reference

Base URL (default): `http://localhost:5000`

Error model (common):

```json
{ "error": "invalid_request" }
```

Authentication:
- Use `Authorization: Bearer <token>` for protected routes

### Auth

- `POST /auth/register`
- `POST /auth/login`

Example request:

```json
{ "email": "user@example.com", "password": "Passw0rd!234" }
```

### Pipelines (protected)

- `GET /pipelines`
- `GET /pipelines/:id`
- `POST /pipelines`
- `PUT /pipelines/:id`
- `DELETE /pipelines/:id`

Create example:

```json
{
  "name": "Mask PII",
  "actionType": "mask_fields",
  "actionConfig": {
    "fields": ["ssn", "cardNumber"],
    "mask": "[REDACTED]"
  }
}
```

### Subscribers (protected)

- `GET /pipelines/:id/subscribers`
- `POST /pipelines/:id/subscribers`
- `PUT /pipelines/subscribers/:id`
- `DELETE /pipelines/subscribers/:id`

Create example:

```json
{ "targetUrl": "https://example.com/webhook-receiver" }
```

### Webhooks (public, rate-limited)

- `POST /webhooks/:sourceKey`

Behavior:
- Validates source key and payload
- Resolves pipeline by source key
- Creates job
- Returns `202 Accepted` with `jobId`

### Jobs

- `GET /jobs` (supports query `status`, `pipelineId`)
- `GET /jobs/:id`
- `GET /jobs/:id/deliveries`

## Pipeline Actions

Supported `actionType` values:

1. `add_fields`
- Config:

```json
{ "add": { "source": "webhook", "version": 2 } }
```

- Behavior:
  - Merges `add` object into payload
  - Existing keys can be overwritten

2. `transform`
- Config:

```json
{
  "pick": ["id", "email"],
  "rename": { "email": "customerEmail" },
  "uppercase": ["customerEmail"]
}
```

- Behavior order:
  - `pick` first
  - then `rename`
  - then `uppercase`

3. `filter`
- Config:

```json
{ "field": "amount", "greaterThan": 100 }
```

- Conditions supported:
  - `equals`
  - `greaterThan`
  - `lessThan`

- Behavior:
  - If condition fails, job output is marked skipped (`filter_not_matched`)

4. `remove_fields`
- Config:

```json
{ "fields": ["password", "token"] }
```

- Behavior:
  - Deletes listed keys from payload copy

5. `lowercase`
- Config:

```json
{ "fields": ["email", "country"] }
```

- Behavior:
  - Lowercases listed fields when values are strings

6. `mask_fields`
- Config:

```json
{ "fields": ["ssn", "cardNumber"], "mask": "***" }
```

- Behavior:
  - Replaces listed fields with mask value
  - Default mask is `***` when omitted

## Data Model

Primary tables:

- `users`: account identity and password hash
- `pipelines`: processing definitions and source keys
- `subscribers`: downstream endpoints for each pipeline
- `jobs`: persisted inbound webhook work items
- `delivery_attempts`: per-subscriber delivery attempts with status/history

Job statuses:

- `pending`
- `processing`
- `completed`
- `failed`

Delivery statuses:

- `pending`
- `success`
- `failed`

## Quality and Testing

API checks:

```bash
cd API
npm run lint
npm test
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Current validated state in this project:

- API lint clean
- API tests passing
- Frontend lint passing
- Frontend production build passing
- Docker compose build/start passing

## Operations and Troubleshooting

### Docker: engine not running

Reason:
- Compose errors mentioning `dockerDesktopLinuxEngine` pipe not found

Fix:
- Start Docker Desktop, wait until engine is ready, rerun compose command

### Schema mismatch after action enum updates

Symptom:
- Pipeline create/update fails for newer action types

Fix:

```bash
cd API
npm run apply-schema
```

### Frontend points to wrong API URL

Symptom:
- Login or API calls fail from UI

Fix:
- Ensure `VITE_API_BASE_URL` is set correctly at build/dev start time
- Rebuild frontend when using production Docker image

### Jobs not progressing

Checklist:
- Verify worker process/container is running
- Verify API and DB are reachable
- Check worker logs for processing or delivery exceptions

### Deliveries fail repeatedly

Checklist:
- Confirm subscriber URL is reachable from worker network context
- Inspect `GET /jobs/:id/deliveries` for error messages and response codes

## Known Limitations and Next Improvements

Potential enhancements:

- Manual retry endpoint for failed deliveries
- Subscriber health metrics (success rate, last success/failure)
- Pagination for jobs and deliveries in large datasets
- More advanced filtering/querying in jobs API
- Improved RBAC and route-level authorization for jobs endpoints
- DLQ-style handling for permanently failed deliveries
- Structured logging and tracing for production observability

---

If you are onboarding, start with:

1. Run Docker Compose
2. Register/login in the UI
3. Create one pipeline and one subscriber
4. Send a test webhook
5. Follow a single job from ingestion to delivery attempts

This gives the fastest end-to-end understanding of the full system.
