-- Migration: 20250101000005_orchestration_state_machines.sql
-- Additive orchestration state machines, shipments, processing batches, and multi-party value chain settlement functions.

-- 1. New Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
        CREATE TYPE shipment_status AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'RECEIVED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_batch_status') THEN
        CREATE TYPE processing_batch_status AS ENUM ('INPUT_RECEIVED', 'PROCESSING', 'QA_FAILED', 'QA_PASSED', 'PACKAGED', 'COMPLETED');
    END IF;
END $$;

-- 2. Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_group_id UUID NOT NULL REFERENCES purchase_groups(id) ON DELETE RESTRICT,
    carrier_party_id UUID REFERENCES party_profiles(id) ON DELETE RESTRICT,
    origin_address TEXT NOT NULL,
    destination_collection_point_id UUID NOT NULL REFERENCES collection_points(id) ON DELETE RESTRICT,
    quantity_units INTEGER NOT NULL CHECK (quantity_units > 0),
    status shipment_status NOT NULL DEFAULT 'PENDING',
    tracking_number VARCHAR(100) UNIQUE,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Processing Batches Table
CREATE TABLE IF NOT EXISTS processing_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processing_order_id UUID NOT NULL REFERENCES processing_orders(id) ON DELETE RESTRICT,
    processor_party_id UUID NOT NULL REFERENCES party_profiles(id) ON DELETE RESTRICT,
    raw_input_quantity_kg NUMERIC(14,2) NOT NULL CHECK (raw_input_quantity_kg > 0),
    actual_output_quantity_units INTEGER NOT NULL CHECK (actual_output_quantity_units >= 0),
    waste_loss_kg NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (waste_loss_kg >= 0),
    qa_notes TEXT,
    status processing_batch_status NOT NULL DEFAULT 'INPUT_RECEIVED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS & Indexes
CREATE INDEX IF NOT EXISTS shipments_group_idx ON shipments (demand_group_id, status);
CREATE INDEX IF NOT EXISTS processing_batches_order_idx ON processing_batches (processing_order_id, status);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_batches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role manages shipments') THEN
        CREATE POLICY "service role manages shipments" ON shipments TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service role manages processing batches') THEN
        CREATE POLICY "service role manages processing batches" ON processing_batches TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. RPC Function: Fund Demand Group and Generate Customer Allocations
CREATE OR REPLACE FUNCTION fund_demand_group_and_allocate(
  p_group_id UUID,
  p_actor_user_id UUID DEFAULT NULL
) RETURNS purchase_groups
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group purchase_groups;
  v_mem RECORD;
  v_code TEXT;
BEGIN
  SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand group not found';
  END IF;

  UPDATE purchase_groups
  SET status = 'FUNDED',
      funded_quantity = committed_quantity,
      updated_at = NOW()
  WHERE id = p_group_id
  RETURNING * INTO v_group;

  INSERT INTO purchase_group_events (group_id, from_status, to_status, actor_user_id, reason)
  VALUES (p_group_id, v_group.status, 'FUNDED', p_actor_user_id, 'Demand group fully funded and customer allocations generated');

  -- Generate claim allocations for members
  FOR v_mem IN SELECT * FROM group_memberships WHERE group_id = p_group_id AND status = 'ACTIVE' LOOP
    IF NOT EXISTS (SELECT 1 FROM customer_allocations WHERE membership_id = v_mem.id) THEN
      v_code := 'CU-' || UPPER(SUBSTRING(uuid_generate_v4()::text, 1, 8));
      INSERT INTO customer_allocations (membership_id, claim_code, status, created_at)
      VALUES (v_mem.id, v_code, 'UNCLAIMED', NOW());
    END IF;
  END LOOP;

  RETURN v_group;
END; $$;

-- 6. RPC Function: Create Supply Contract
CREATE OR REPLACE FUNCTION create_supply_contract_rpc(
  p_demand_group_id UUID,
  p_party_profile_id UUID,
  p_product_id UUID,
  p_contracted_quantity INTEGER,
  p_unit_price NUMERIC
) RETURNS supply_contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_contract supply_contracts;
BEGIN
  INSERT INTO supply_contracts (
    demand_group_id, party_profile_id, product_id, contracted_quantity, unit_price, status
  ) VALUES (
    p_demand_group_id, p_party_profile_id, p_product_id, p_contracted_quantity, p_unit_price, 'COMMITTED'
  ) RETURNING * INTO v_contract;

  UPDATE purchase_groups SET status = 'SUPPLY_MATCHED', updated_at = NOW() WHERE id = p_demand_group_id;

  RETURN v_contract;
END; $$;

-- 7. RPC Function: Create Processing Order and Batch
CREATE OR REPLACE FUNCTION create_processing_order_and_batch_rpc(
  p_demand_group_id UUID,
  p_processor_party_id UUID,
  p_transformation_spec_id UUID,
  p_input_quantity INTEGER,
  p_output_quantity INTEGER,
  p_milling_fee NUMERIC
) RETURNS processing_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order processing_orders;
BEGIN
  INSERT INTO processing_orders (
    demand_group_id, processor_party_id, transformation_spec_id,
    input_quantity, output_quantity, milling_fee_total, status
  ) VALUES (
    p_demand_group_id, p_processor_party_id, p_transformation_spec_id,
    p_input_quantity, p_output_quantity, p_milling_fee, 'PROCESSING'
  ) RETURNING * INTO v_order;

  INSERT INTO processing_batches (
    processing_order_id, processor_party_id, raw_input_quantity_kg, actual_output_quantity_units, status
  ) VALUES (
    v_order.id, p_processor_party_id, p_input_quantity, p_output_quantity, 'QA_PASSED'
  );

  UPDATE purchase_groups SET status = 'IN_FULFILMENT', updated_at = NOW() WHERE id = p_demand_group_id;

  RETURN v_order;
END; $$;

-- 8. RPC Function: Multi-Party Value Chain Settlement
CREATE OR REPLACE FUNCTION process_value_chain_settlement(
  p_group_id UUID,
  p_payment_transaction_id UUID,
  p_total_amount NUMERIC,
  p_farmer_party_id UUID DEFAULT NULL,
  p_processor_party_id UUID DEFAULT NULL,
  p_carrier_party_id UUID DEFAULT NULL,
  p_depot_party_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_platform_share NUMERIC;
  v_farmer_share NUMERIC;
  v_processor_share NUMERIC;
  v_carrier_share NUMERIC;
  v_depot_share NUMERIC;
BEGIN
  -- Multi-party value chain fee breakdown:
  -- 5% Platform Fee
  -- 55% Raw Material Supply (Farmer/Cooperative)
  -- 15% Processing & Milling (Processor)
  -- 15% Packaging & Logistics (Carrier)
  -- 10% Depot Commission (Collection Point Operator)
  v_platform_share := ROUND(p_total_amount * 0.05, 2);
  v_farmer_share   := ROUND(p_total_amount * 0.55, 2);
  v_processor_share:= ROUND(p_total_amount * 0.15, 2);
  v_carrier_share  := ROUND(p_total_amount * 0.15, 2);
  v_depot_share    := p_total_amount - (v_platform_share + v_farmer_share + v_processor_share + v_carrier_share);

  INSERT INTO settlement_allocations (payment_transaction_id, recipient_party_id, allocation_type, amount, status)
  VALUES
    (p_payment_transaction_id, NULL, 'PLATFORM_FEE', v_platform_share, 'ESCROW_HELD'),
    (p_payment_transaction_id, p_farmer_party_id, 'RAW_SUPPLY', v_farmer_share, 'ESCROW_HELD'),
    (p_payment_transaction_id, p_processor_party_id, 'PROCESSING_FEE', v_processor_share, 'ESCROW_HELD'),
    (p_payment_transaction_id, p_carrier_party_id, 'LOGISTICS_FEE', v_carrier_share, 'ESCROW_HELD'),
    (p_payment_transaction_id, p_depot_party_id, 'DEPOT_COMMISSION', v_depot_share, 'ESCROW_HELD');
END; $$;

-- Revoke/Grant Permissions
REVOKE ALL ON FUNCTION fund_demand_group_and_allocate(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_supply_contract_rpc(UUID, UUID, UUID, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_processing_order_and_batch_rpc(UUID, UUID, UUID, INTEGER, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION process_value_chain_settlement(UUID, UUID, NUMERIC, UUID, UUID, UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION fund_demand_group_and_allocate(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_supply_contract_rpc(UUID, UUID, UUID, INTEGER, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION create_processing_order_and_batch_rpc(UUID, UUID, UUID, INTEGER, INTEGER, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION process_value_chain_settlement(UUID, UUID, NUMERIC, UUID, UUID, UUID, UUID) TO service_role;
