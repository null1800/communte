# Database Foundation

PostgreSQL/Supabase is the intended system of record. The original migrations create legacy prototype tables (`groups`, `group_members`, `contributions`, and `orders`) which do not describe the running API or the target model. Migration `20250101000002_canonical_group_buying_foundation.sql` is deliberately additive: it introduces canonical tables without deleting or rewriting existing data.

Do not point new application code at the legacy tables. Migrate legacy data only through a reviewed, reversible data migration after production data has been inspected.

Apply migrations in order using the Supabase CLI or the deployment migration runner. No dashboard-only schema changes are permitted. Migration `20250101000003_transactional_group_writes.sql` adds the initial transactional RPC boundary: supplier-owned offer creation, group creation, and an idempotent membership commitment. It locks group and offer rows, prevents target/inventory over-allocation, and writes the status event on target completion.

Important integrity rules include one supplier profile per user, one membership per user/group, one order per group, unique idempotency keys, non-negative money/quantity values, and immutable payment/status-event records.
