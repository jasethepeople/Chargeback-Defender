# Chargeback-Defender

A web app that helps Shopify merchants fight chargebacks: assemble evidence, track dispute deadlines, and submit stronger dispute packages. Exported from [replit.com/@isitlocated/Chargeback-Defender](https://replit.com/@isitlocated/Chargeback-Defender).

## Features

In-progress, from the actual code (`artifacts/api-server/src/routes/disputes.ts`, `lib/db/src/schema/disputes.ts`, `replit.md`):

- **Dispute queue** — list and search disputes with status filters, deadlines, and CSV export.
- **Evidence workspace** — evidence items across order, tracking, IP, email, delivery photo, and prior-order history, each with a status (verified / found / missing) and source (Shopify, EasyPost, etc.), stored as queryable JSON on the dispute record.
- **Evidence generation** — refresh/generate flow that assembles an evidence package per dispute reason (product-not-received, unrecognized, fraud).
- **Submission** — dispute submission with PDF readiness flag and status mutation.
- **Webhooks** — Stripe and Shopify Payments webhook endpoints for normalized incoming disputes.
- **Dashboard** — recovery metrics, trend bars, priority queue, and recent activity (`/api` dashboard endpoints).
- **Frontend** (`artifacts/chargeback-defender/`) — React + Vite dashboard UI: disputes queue, evidence workspace, activity, settings.

## Tech stack

pnpm workspaces, Node.js 24, TypeScript 5.9, Express 5, PostgreSQL + Drizzle ORM, Zod (v4), Orval API codegen (contract-first: OpenAPI spec generates React Query hooks and server validators), esbuild; React + Vite + Tailwind for the dashboard.

## Getting started

Per `replit.md`:

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` / `pnpm run build` — typecheck and build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- The frontend expects the shared API server under `/api`; do not hardcode a localhost API origin.

## Project structure

```
├── artifacts/chargeback-defender/  # React + Vite dashboard UI
├── artifacts/api-server/           # Express server (disputes routes)
├── artifacts/mockup-sandbox/       # UI mockup scaffold
├── lib/db/src/schema/disputes.ts   # disputes table + evidence JSON schema
├── lib/api-spec/openapi.yaml       # source of truth for API contracts
├── lib/api-zod/                    # generated Zod validators
└── lib/api-client-react/           # generated React Query hooks
```

## Status

In progress. Routes, schema, dashboard UI, and product docs in `replit.md` are substantially built; per the architecture notes, provider OAuth (real Shopify/Stripe data) is not yet authorized, and the current build runs on seeded PostgreSQL data.
