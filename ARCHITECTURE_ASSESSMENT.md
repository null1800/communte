# ComUnite Engineering Assessment — 2026-09-20

## A. Current architecture

| Area | Observed implementation | Assessment |
| --- | --- | --- |
| Frontend | Next.js App Router, Tailwind, reusable shell/components, hand-written fetch client | Usable presentation foundation; no server-state library and several production routes consume mocks. |
| Backend | NestJS controllers with a single `DatabaseService` | Controller/service split exists, but the service stores all business data in process memory. |
| Database | Two Supabase SQL migrations | Schema is not used by the API and does not contain the API's `product_offers` model. |
| Authentication | Phone-only endpoint returns `jwt-...` strings; frontend persists default users | No identity verification, signing, token verification, or session revocation. |
| Authorization | Request bodies/query strings contain user/supplier IDs and roles | No ownership, role, or resource authorization. |
| Payments | Mock MTN provider and in-memory contribution/wallet services | Simulated success; no persistence, webhook validation, or idempotent settlement. |
| Deployment/configuration | Port and browser API URL only | No environment contract, migration runner, health/readiness split, or secret configuration. |
| Testing | Jest dependency only | No test configuration or tests. |

## B. KEEP

- Monorepo separation of web, API, and shared type package.
- NestJS application bootstrap, Helmet, validation-pipe intent, and rate-limiter dependency.
- Next.js responsive shell components and the real loading/error/empty-state pattern in Discover.
- The conceptual distinction already present in parts of the code between products, offers, groups, contributions, and orders.
- Existing migration history as a legacy record; it must not be silently deleted.

## C. REFACTOR

- Replace `DatabaseService` with repositories backed by the canonical PostgreSQL schema and transaction-aware application services.
- Rework shared types into API DTOs and response models with canonical role/status terminology.
- Move group resolution, payment application, order creation, and fulfilment transitions into explicit services with database transactions.
- Rework API client around authenticated requests, consistent error envelopes, and feature-level query/cache hooks.
- Replace static categories/helpers with non-domain presentation constants where appropriate; all products, groups, orders, demand, and search results must come from the API.

## D. REPLACE

- `AuthController` prototype login and unsigned token construction.
- Caller-controlled `user_id`, `supplier_id`, and status updates in controllers.
- In-memory financial ledger, payments, users, products, offers, groups, and orders.
- Mock payment provider's unconditional webhook acceptance and successful status response.
- Legacy group status model (`FUNDING`, `FUNDED`, `PARTIAL_FUNDED`, `EXTENSION_VOTE`) as the core lifecycle; it conflates committed quantities, money, and resolution policy.

## E. REMOVE (after dependent production routes are migrated)

- `apps/web/src/lib/mock-data.ts` product/group/member/order/savings fixtures.
- Default customer/supplier sessions, local-auth fallback, and hard-coded `sup-default-001` references.
- `HabitService` and wallet arrays until they are rebuilt against immutable domain records; they should not ship as financial/accounting features.
- Generated `dist` output and local dependency directories from source control (now covered by `.gitignore`).

## F. Missing foundations

- PostgreSQL client/repository implementation, deterministic local/staging database setup, and a migration execution command.
- Verified authentication (OTP or managed identity provider), token guard, role/profile permissions, and audit logs.
- Canonical supplier profile and product offer persistence; product offer publication/expiry policy.
- Transactional group commitment, payment event/webhook processing, order creation, and fulfilment state machine.
- DTO validation classes, stable error handling, request correlation/structured logs, health/readiness checks, and error tracking.
- Unit and integration test suites plus CI scripts for lint, type check, migration verification, and tests.

## Foundation stage 1 implemented

- Removed the in-memory `DatabaseService` execution model and the unauthorised legacy order/supplier endpoints.
- Added a versioned API, global bearer-token guard, role guard, configuration-gated development token endpoint, and liveness/readiness endpoints.
- Added canonical transactional PostgreSQL functions for supplier-owned offer creation, group creation, and idempotent group commitments. They lock the relevant records and enforce group target and offer-inventory limits in the database.
- Removed the in-memory wallet, habit, payment-resolution, and mock provider code from the running API. Payment settlement, order creation, and fulfilment are intentionally not exposed until their persistent implementations are complete.
- Removed the browser's seeded default users, local authentication fallback, and demo OTP component. The remaining fixture-driven presentation components are a known phase-two migration item and are not evidence of a live backend flow.

## Core-flow trace

The current apparent flow is `login -> create offer -> create group -> join -> order`, but it is not a real end-to-end flow. Login creates/edits an in-memory user and accepts the requested role. Offer creation invents a supplier if the supplied ID is unknown. Group creation immediately creates a successful contribution; joining does the same. Completion immediately creates an order. Every record vanishes on API restart, and no request is authorized. The frontend can still appear functional even when the API is unreachable because authentication falls back to local state and other routes render fixtures.
