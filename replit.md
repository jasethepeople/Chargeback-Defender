# Chargeback Defender

Chargeback Defender helps Shopify merchants assemble chargeback evidence, track deadlines, and submit stronger dispute packages.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/chargeback-defender/src/` — React/Vite dashboard, disputes queue, evidence workspace, activity, and settings
- `artifacts/api-server/src/routes/disputes.ts` — dashboard, disputes, evidence, submission, and webhook handlers
- `lib/api-spec/openapi.yaml` — source of truth for API contracts and generated hooks
- `lib/db/src/schema/disputes.ts` — persisted dispute record and evidence JSON schema
- `artifacts/chargeback-defender/src/index.css` — product theme tokens and global styles

## Architecture decisions

- The API is contract-first: OpenAPI generates both React Query hooks and server-side Zod validators.
- Dispute evidence is stored as queryable JSON on the dispute record so each evidence source can render independently.
- The first build uses seeded PostgreSQL data so the operator experience works before provider OAuth is authorized.
- Stripe and Shopify webhook routes accept normalized dispute events; provider-specific lookup adapters can fill in order and delivery evidence next.

## Product

- Overview dashboard with recovery metrics, trend bars, priority queue, and recent activity
- Dispute queue with search, status filters, CSV export, deadlines, and detail navigation
- Evidence workspace for order, tracking, IP, email, delivery photo, and prior-order proof
- Evidence PDF download, refresh/generate flow, and submission status mutation
- Settings surface for store connections, sync preferences, plan information, and pricing
- Stripe and Shopify Payments webhook endpoints for normalized incoming disputes

## User preferences

None recorded.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- The frontend expects the shared API server under `/api`; do not hardcode a localhost API origin.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
