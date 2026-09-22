# ComUnite Domain Model

## Canonical relationships

```text
User --0..1--> SupplierProfile --*--> ProductOffer --1--> Product
                                      |
                                      *
                                  PurchaseGroup --*--> GroupMembership --*--> Contribution
                                      |
                                      0..1
                                     Order --0..1--> Fulfilment
```

A user may be a customer, supplier, or administrator through roles and profiles; identities are never duplicated. A `Product` is reusable catalog information. A `ProductOffer` is a supplier's time-bounded commercial commitment. A `PurchaseGroup` aggregates customer quantity for exactly one offer. An `Order` is created after a group resolution; it is not the group itself.

## Quantity and money

`requested_quantity`, `committed_quantity`, and `funded_quantity` are separate quantities. `unit_price`, `amount_due`, and payment transaction amounts are monetary values. Reaching a quantity target does not imply that money was received; funded quantity is updated only by the payment/contribution application service after a verified payment.

## Group lifecycle

`DRAFT -> OPEN -> TARGET_REACHED -> PROCESSING -> ORDER_CREATED -> FULFILLED`

Terminal alternatives are `EXPIRED`, `CANCELLED`, and `FAILED`. Only the service layer can move a group. `OPEN` accepts commitments before its deadline. `TARGET_REACHED` means the required committed quantity is met; it does not itself create an order. `PROCESSING` is entered after qualifying payment and resolution checks. A unique order-per-group constraint makes `ORDER_CREATED` idempotent.

The schema records status transitions as append-only events. Cancellation/refund behaviour must be implemented as new immutable payment/ledger events, never balance mutation.

