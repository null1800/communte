# ADR 0001: Add a canonical group-buying schema beside legacy prototype tables

## Problem

The legacy migration models supplier and offer data separately from the running API, associates groups directly with products, and lacks a canonical offer-to-group-to-order chain. The API does not currently use the database at all.

## Options considered

1. Rewrite or drop legacy tables in place.
2. Continue extending the legacy schema.
3. Add canonical tables and deprecate legacy tables after a reviewed data migration.

## Decision

Choose option 3. The new migration is additive and records the canonical relationships, constraints, indexes, and lifecycle event history. New backend work targets this schema.

## Consequences

There is temporary duplication while the persistence layer is replaced. This is intentional: no data is silently destroyed and the cutover can be tested. Legacy tables will be removed only in a separately approved migration after verified export and reconciliation.

