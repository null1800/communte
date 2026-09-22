# ComUnite Architecture

## Current state after foundation stage 1

This repository is an npm workspace with a Next.js web application, a NestJS API, shared TypeScript types, and SQL files intended for Supabase/PostgreSQL. It is **not production-ready** today: the Nest API uses in-memory `Map` and array collections rather than PostgreSQL, and those collections are lost on restart. The SQL schema is therefore not the source of truth for the running application.

The API now has a PostgreSQL/Supabase gateway rather than process-memory maps. Its core offer and group writes use database RPC functions so allocation and idempotency are committed atomically. The API is versioned under `/v1`, rejects unauthenticated writes, and derives the actor from a verified bearer token. The former unprotected order and supplier controllers have been removed instead of being exposed on the new boundary.

The web shell remains a migration-in-progress: the default local user and unreachable-API authentication fallback have been removed, but several presentation components still import legacy fixtures. Identity-provider integration and replacement of those non-core screens are the next explicit stage; they must not be represented as live platform data.

## Target architecture

```text
Next.js web application
  -> typed API client (bearer access token only)
  -> NestJS controllers (DTO validation, authentication, authorization)
  -> application/domain services (offer, group, contribution, order, fulfilment)
  -> repository/transaction boundary
  -> PostgreSQL/Supabase (canonical migrations, constraints, audit records)
```

The API is the only component allowed to make lifecycle, financial, allocation, or authorization decisions. The frontend owns presentation state, form state, and cache invalidation; it does not derive persisted financial or group state.

## Module boundaries

- `Auth`: identity verification, sessions, current-user lookup.
- `Supplier`: a `User`-owned supplier profile and supplier authorization.
- `Catalog`: reusable products, supplier-owned product offers, publication/expiry.
- `Groups`: creation, membership commitments, lifecycle transitions, demand totals.
- `Payments`: provider requests/webhooks and immutable payment transaction records.
- `Orders` and `Fulfilment`: fulfilment obligations created once a qualifying group resolves.

Each write uses a database transaction. Idempotency keys and unique constraints protect retried joins, payment requests, webhooks, and order creation.

## Delivery sequence

1. Apply migrations through `20250101000003_transactional_group_writes.sql` and configure the API environment. This stage is implemented.
2. Integrate the approved OTP/identity provider and use its verified claims to issue/access tokens; replace frontend fixture imports with typed API queries.
3. Implement verified payment-webhook settlement, funded-quantity calculation, group resolution, idempotent order creation, and fulfilment transitions.
4. Add integration tests against a disposable PostgreSQL database, then complete the supplier-to-demand vertical slice.
