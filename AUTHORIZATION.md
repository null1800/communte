# Authentication and Authorization

The current `POST /auth/login` endpoint is a prototype and is unsafe: callers can select a role and receive an unsigned token. It must not be deployed.

The production chain is:

```text
Verified identity -> authenticated user -> roles/profiles -> resource authorization
```

Controllers obtain the actor exclusively from a verified access token, never from `user_id`, `supplier_id`, or `role` request fields. Supplier writes require ownership of the offer's supplier profile. Customer writes require ownership of the membership/contribution. Administrator operations require an explicit administrator role. Row-level security is defence in depth; API authorization remains mandatory when using a service database role.

Payment webhooks require provider signature validation, provider-reference uniqueness, and idempotent event processing. The current mock provider always accepts webhooks and returns success; it must remain disabled outside a clearly labelled test environment.

The implemented API applies a global bearer-token guard and a role guard. `POST /v1/product-offers` requires `SUPPLIER`; group creation and commitments require an authenticated `CUSTOMER` or `SUPPLIER`. Actor IDs are obtained from the token and passed into database functions only by the API. `AUTH_DEV_MODE=true` permits a short-lived development token endpoint; it is disabled by default and must never be enabled in a deployed environment.
