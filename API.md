# API Contract Principles

All endpoints are versioned under `/v1`. Controllers validate DTOs and map domain errors to a stable envelope:

```json
{ "error": { "code": "GROUP_NOT_OPEN", "message": "This group is no longer accepting commitments." } }
```

Write endpoints derive the actor from authentication. They accept domain input only, for example a group commitment accepts `requestedQuantity` and an idempotency key, not a customer id or a payment-success flag.

Implemented routes are `GET /v1/health/live`, `GET /v1/health/ready`, public offer/group reads, supplier-only `POST /v1/product-offers`, authenticated `POST /v1/groups`, and authenticated `POST /v1/groups/:id/commitments`. The commitment body is `{ "requestedQuantity": number, "idempotencyKey": UUID }`; it never contains a user ID, payment state, or supplier ID. Payment, order, fulfilment, and supplier-demand routes remain deliberately unavailable until their transactional services exist.
