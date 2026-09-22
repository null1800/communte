-- Canonical group-buying foundation. Additive by design; see ADR 0001.

CREATE TYPE supplier_profile_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE product_offer_status AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'EXPIRED', 'CANCELLED');
CREATE TYPE purchase_group_status AS ENUM ('DRAFT', 'OPEN', 'TARGET_REACHED', 'PROCESSING', 'ORDER_CREATED', 'FULFILLED', 'EXPIRED', 'CANCELLED', 'FAILED');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'CANCELLED', 'FULFILLED');
CREATE TYPE contribution_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE fulfilment_status AS ENUM ('PENDING', 'READY_FOR_COLLECTION', 'DISPATCHED', 'DELIVERED', 'FAILED');

CREATE TABLE supplier_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    legal_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100),
    address TEXT NOT NULL,
    status supplier_profile_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_profile_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    unit_name VARCHAR(50) NOT NULL,
    available_quantity INTEGER NOT NULL CHECK (available_quantity > 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0 AND reserved_quantity <= available_quantity),
    minimum_order_quantity INTEGER NOT NULL CHECK (minimum_order_quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price > 0),
    retail_reference_price NUMERIC(14,2) CHECK (retail_reference_price > 0),
    availability_starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    availability_ends_at TIMESTAMPTZ,
    fulfilment_terms TEXT NOT NULL,
    status product_offer_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (availability_ends_at IS NULL OR availability_ends_at > availability_starts_at)
);

CREATE TABLE purchase_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_offer_id UUID NOT NULL REFERENCES product_offers(id) ON DELETE RESTRICT,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    target_quantity INTEGER NOT NULL CHECK (target_quantity > 0),
    committed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (committed_quantity >= 0 AND committed_quantity <= target_quantity),
    funded_quantity INTEGER NOT NULL DEFAULT 0 CHECK (funded_quantity >= 0 AND funded_quantity <= committed_quantity),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price > 0),
    collection_point TEXT NOT NULL,
    closes_at TIMESTAMPTZ NOT NULL,
    status purchase_group_status NOT NULL DEFAULT 'DRAFT',
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES purchase_groups(id) ON DELETE RESTRICT,
    customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    committed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (committed_quantity >= 0 AND committed_quantity <= requested_quantity),
    amount_due NUMERIC(14,2) NOT NULL CHECK (amount_due >= 0),
    status membership_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, customer_user_id)
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES group_memberships(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL,
    provider_reference VARCHAR(128) UNIQUE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'ZMW',
    initial_status contribution_status NOT NULL DEFAULT 'PENDING',
    provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

CREATE TABLE payment_transaction_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
    provider_event_id VARCHAR(128) UNIQUE,
    status contribution_status NOT NULL,
    provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_group_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES purchase_groups(id) ON DELETE RESTRICT,
    from_status purchase_group_status,
    to_status purchase_group_status NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL UNIQUE REFERENCES purchase_groups(id) ON DELETE RESTRICT,
    product_offer_id UUID NOT NULL REFERENCES product_offers(id) ON DELETE RESTRICT,
    supplier_profile_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price > 0),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fulfilments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES group_orders(id) ON DELETE RESTRICT,
    status fulfilment_status NOT NULL DEFAULT 'PENDING',
    collection_point TEXT NOT NULL,
    tracking_reference VARCHAR(128),
    ready_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX product_offers_discovery_idx ON product_offers (status, availability_starts_at, availability_ends_at);
CREATE INDEX purchase_groups_offer_status_idx ON purchase_groups (product_offer_id, status, closes_at);
CREATE INDEX group_memberships_customer_idx ON group_memberships (customer_user_id, status);
CREATE INDEX payment_transactions_membership_idx ON payment_transactions (membership_id, created_at DESC);
CREATE INDEX payment_transaction_events_transaction_idx ON payment_transaction_events (payment_transaction_id, received_at DESC);
CREATE INDEX purchase_group_events_group_idx ON purchase_group_events (group_id, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_canonical_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Table % is append-only; create a compensating event instead.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_immutable
BEFORE UPDATE OR DELETE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_canonical_ledger_mutation();

CREATE TRIGGER payment_transaction_events_immutable
BEFORE UPDATE OR DELETE ON payment_transaction_events
FOR EACH ROW EXECUTE FUNCTION prevent_canonical_ledger_mutation();

CREATE TRIGGER purchase_group_events_immutable
BEFORE UPDATE OR DELETE ON purchase_group_events
FOR EACH ROW EXECUTE FUNCTION prevent_canonical_ledger_mutation();

-- The web client never accesses canonical financial or write tables directly.
-- The API service role is responsible for authorization and transactional writes.
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfilments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages canonical supplier profiles" ON supplier_profiles TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical offers" ON product_offers TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical groups" ON purchase_groups TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical memberships" ON group_memberships TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical payments" ON payment_transactions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical payment events" ON payment_transaction_events TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical group events" ON purchase_group_events TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical orders" ON group_orders TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages canonical fulfilments" ON fulfilments TO service_role USING (true) WITH CHECK (true);
