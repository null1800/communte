-- Migration: 20250101000004_value_chain_and_multi_party_schema.sql
-- Additive schema expansion for ComUnite Hybrid Architecture (Model A + Model B).

-- 1. New Enums
CREATE TYPE party_type AS ENUM ('CUSTOMER', 'SUPPLIER', 'FARMER', 'PROCESSOR', 'CARRIER', 'DEPOT_OPERATOR');
CREATE TYPE fulfillment_mode AS ENUM ('MODEL_A_DIRECT', 'MODEL_B_VALUE_CHAIN');
CREATE TYPE supply_contract_status AS ENUM ('DRAFT', 'COMMITTED', 'FULFILLED', 'CANCELLED');
CREATE TYPE processing_order_status AS ENUM ('PLANNED', 'INPUT_RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE allocation_type AS ENUM ('RAW_SUPPLY', 'PROCESSING_FEE', 'PACKAGING', 'LOGISTICS_FEE', 'DEPOT_COMMISSION', 'PLATFORM_FEE');
CREATE TYPE allocation_status AS ENUM ('ESCROW_HELD', 'READY_FOR_DISBURSEMENT', 'DISBURSED', 'REFUNDED');
CREATE TYPE claim_status AS ENUM ('UNCLAIMED', 'CLAIMED', 'EXPIRED', 'CANCELLED');

-- 2. Collection Points (First-class physical depot nodes)
CREATE TABLE collection_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    operator_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    capacity_units INTEGER NOT NULL DEFAULT 1000 CHECK (capacity_units > 0),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Party Profiles (Generalised roles across suppliers, farmers, processors, carriers, depot operators)
CREATE TABLE party_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    party_type party_type NOT NULL,
    legal_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100),
    address TEXT NOT NULL,
    status supplier_profile_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, party_type)
);

-- 4. Transformation Specs (Raw material to output product yield definitions)
CREATE TABLE transformation_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    input_raw_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    output_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    conversion_ratio NUMERIC(10, 4) NOT NULL CHECK (conversion_ratio > 0), -- e.g. 1.4 kg raw maize per 1 kg mealie meal
    processing_cost_per_unit NUMERIC(14, 2) NOT NULL CHECK (processing_cost_per_unit >= 0),
    yield_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Extend purchase_groups (demand_groups) for Hybrid fulfillment
ALTER TABLE purchase_groups ALTER COLUMN product_offer_id DROP NOT NULL;
ALTER TABLE purchase_groups ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE RESTRICT;
ALTER TABLE purchase_groups ADD COLUMN collection_point_id UUID REFERENCES collection_points(id) ON DELETE RESTRICT;
ALTER TABLE purchase_groups ADD COLUMN fulfillment_mode fulfillment_mode NOT NULL DEFAULT 'MODEL_A_DIRECT';

-- 6. Supply Contracts (Multi-source raw material or finished product commitments)
CREATE TABLE supply_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_group_id UUID NOT NULL REFERENCES purchase_groups(id) ON DELETE RESTRICT,
    party_profile_id UUID NOT NULL REFERENCES party_profiles(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    contracted_quantity INTEGER NOT NULL CHECK (contracted_quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price > 0),
    status supply_contract_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Processing Orders (Milling & transformation tracking)
CREATE TABLE processing_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_group_id UUID NOT NULL REFERENCES purchase_groups(id) ON DELETE RESTRICT,
    processor_party_id UUID NOT NULL REFERENCES party_profiles(id) ON DELETE RESTRICT,
    transformation_spec_id UUID NOT NULL REFERENCES transformation_specs(id) ON DELETE RESTRICT,
    input_quantity INTEGER NOT NULL CHECK (input_quantity > 0),
    output_quantity INTEGER NOT NULL CHECK (output_quantity > 0),
    milling_fee_total NUMERIC(14, 2) NOT NULL CHECK (milling_fee_total >= 0),
    status processing_order_status NOT NULL DEFAULT 'PLANNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Settlement Allocations (Immutable multi-party financial splits per transaction)
CREATE TABLE settlement_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
    recipient_party_id UUID REFERENCES party_profiles(id) ON DELETE RESTRICT,
    allocation_type allocation_type NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    status allocation_status NOT NULL DEFAULT 'ESCROW_HELD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- 9. Customer Allocations (Individual pickup entitlement & claim codes)
CREATE TABLE customer_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES group_memberships(id) ON DELETE RESTRICT,
    claim_code VARCHAR(64) UNIQUE NOT NULL,
    status claim_status NOT NULL DEFAULT 'UNCLAIMED',
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Indexes & RLS
CREATE INDEX collection_points_active_idx ON collection_points (is_active);
CREATE INDEX party_profiles_user_type_idx ON party_profiles (user_id, party_type);
CREATE INDEX supply_contracts_group_idx ON supply_contracts (demand_group_id, status);
CREATE INDEX settlement_allocations_tx_idx ON settlement_allocations (payment_transaction_id);
CREATE INDEX customer_allocations_code_idx ON customer_allocations (claim_code);

ALTER TABLE collection_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages collection points" ON collection_points TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages party profiles" ON party_profiles TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages transformation specs" ON transformation_specs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages supply contracts" ON supply_contracts TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages processing orders" ON processing_orders TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages settlement allocations" ON settlement_allocations TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role manages customer allocations" ON customer_allocations TO service_role USING (true) WITH CHECK (true);

-- 11. Transactional RPC Functions for Hybrid Demand Groups

-- Function 1: Create Demand Group (Supports Model A Offer-bound & Model B Demand-first)
CREATE OR REPLACE FUNCTION create_hybrid_demand_group(
  p_actor_user_id UUID,
  p_product_id UUID,
  p_product_offer_id UUID DEFAULT NULL,
  p_collection_point_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_target_quantity INTEGER DEFAULT 100,
  p_unit_price NUMERIC DEFAULT 0,
  p_closes_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  p_fulfillment_mode fulfillment_mode DEFAULT 'MODEL_A_DIRECT'
) RETURNS purchase_groups
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_offer product_offers;
  v_product products;
  v_group purchase_groups;
  v_price NUMERIC := p_unit_price;
  v_coll_point TEXT := 'Central Depot';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_actor_user_id AND is_active) THEN
    RAISE EXCEPTION 'Authenticated user is not active';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target product not found or inactive';
  END IF;

  IF p_collection_point_id IS NOT NULL THEN
    SELECT name INTO v_coll_point FROM collection_points WHERE id = p_collection_point_id AND is_active;
  END IF;

  IF p_fulfillment_mode = 'MODEL_A_DIRECT' THEN
    IF p_product_offer_id IS NULL THEN
      RAISE EXCEPTION 'Model A direct group requires a valid product_offer_id';
    END IF;
    SELECT * INTO v_offer FROM product_offers WHERE id = p_product_offer_id FOR UPDATE;
    IF NOT FOUND OR v_offer.status <> 'PUBLISHED' THEN
      RAISE EXCEPTION 'Product offer is unavailable';
    END IF;
    v_price := v_offer.unit_price;
  ELSE
    IF v_price <= 0 THEN
      v_price := v_product.price_per_unit;
    END IF;
  END IF;

  INSERT INTO purchase_groups (
    product_offer_id, product_id, collection_point_id, created_by_user_id,
    title, target_quantity, unit_price, collection_point, closes_at, status, fulfillment_mode
  ) VALUES (
    p_product_offer_id, p_product_id, p_collection_point_id, p_actor_user_id,
    p_title, p_target_quantity, v_price, v_coll_point, p_closes_at, 'OPEN', p_fulfillment_mode
  ) RETURNING * INTO v_group;

  INSERT INTO purchase_group_events (group_id, to_status, actor_user_id, reason)
  VALUES (v_group.id, 'OPEN', p_actor_user_id, 'Hybrid demand group created');

  RETURN v_group;
END; $$;

-- Function 2: Process Multi-Party Settlement Allocations
CREATE OR REPLACE FUNCTION process_group_settlement(
  p_group_id UUID,
  p_payment_transaction_id UUID,
  p_total_amount NUMERIC
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group purchase_groups;
  v_platform_share NUMERIC;
  v_supplier_share NUMERIC;
BEGIN
  SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand group not found';
  END IF;

  -- Standard 5% platform fee split; 95% to supplier/supply chain ledger
  v_platform_share := ROUND(p_total_amount * 0.05, 2);
  v_supplier_share := p_total_amount - v_platform_share;

  INSERT INTO settlement_allocations (payment_transaction_id, recipient_party_id, allocation_type, amount, status)
  VALUES
    (p_payment_transaction_id, NULL, 'PLATFORM_FEE', v_platform_share, 'ESCROW_HELD'),
    (p_payment_transaction_id, NULL, 'RAW_SUPPLY', v_supplier_share, 'ESCROW_HELD');
END; $$;

REVOKE ALL ON FUNCTION create_hybrid_demand_group(UUID, UUID, UUID, UUID, TEXT, INTEGER, NUMERIC, TIMESTAMPTZ, fulfillment_mode) FROM PUBLIC;
REVOKE ALL ON FUNCTION process_group_settlement(UUID, UUID, NUMERIC) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION create_hybrid_demand_group(UUID, UUID, UUID, UUID, TEXT, INTEGER, NUMERIC, TIMESTAMPTZ, fulfillment_mode) TO service_role;
GRANT EXECUTE ON FUNCTION process_group_settlement(UUID, UUID, NUMERIC) TO service_role;
