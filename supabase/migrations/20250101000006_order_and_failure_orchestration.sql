-- Migration: 20250101000006_order_and_failure_orchestration.sql
-- Transactional functions for idempotent group order creation, failure state orchestration, and settlement validation.

-- 1. Function: Create Group Order from Resolved/Funded Purchase Group
CREATE OR REPLACE FUNCTION create_group_order_rpc(
  p_group_id UUID
) RETURNS group_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group purchase_groups;
  v_offer product_offers;
  v_supplier_id UUID;
  v_order group_orders;
  v_existing group_orders;
BEGIN
  -- Idempotency check: if order already exists for this group, return it
  SELECT * INTO v_existing FROM group_orders WHERE group_id = p_group_id;
  IF FOUND THEN
    RETURN v_existing;
  END IF;

  SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand group not found';
  END IF;

  IF v_group.status NOT IN ('TARGET_REACHED', 'FUNDED', 'PROCESSING', 'SUPPLY_MATCHED', 'IN_FULFILMENT') THEN
    RAISE EXCEPTION 'Group must be resolved or funded before order creation';
  END IF;

  -- Determine supplier_profile_id
  IF v_group.product_offer_id IS NOT NULL THEN
    SELECT supplier_profile_id INTO v_supplier_id FROM product_offers WHERE id = v_group.product_offer_id;
  ELSE
    -- For Model B value chain groups, resolve from party profile or supplier profile
    SELECT id INTO v_supplier_id FROM supplier_profiles WHERE status = 'ACTIVE' LIMIT 1;
  END IF;

  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'No active supplier profile associated with group resolution';
  END IF;

  BEGIN
    INSERT INTO group_orders (
      group_id, product_offer_id, supplier_profile_id, quantity, unit_price, total_amount
    ) VALUES (
      p_group_id, v_group.product_offer_id, v_supplier_id, v_group.committed_quantity, v_group.unit_price, v_group.committed_quantity * v_group.unit_price
    ) RETURNING * INTO v_order;
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_existing FROM group_orders WHERE group_id = p_group_id;
    RETURN v_existing;
  END;

  -- Create initial fulfilment record
  INSERT INTO fulfilments (order_id, status, collection_point)
  VALUES (v_order.id, 'PENDING', v_group.collection_point)
  ON CONFLICT (order_id) DO NOTHING;

  -- Update group status to ORDER_CREATED
  UPDATE purchase_groups
  SET status = 'ORDER_CREATED', updated_at = NOW()
  WHERE id = p_group_id;

  INSERT INTO purchase_group_events (group_id, from_status, to_status, reason)
  VALUES (p_group_id, v_group.status, 'ORDER_CREATED', 'Idempotent group order created');

  RETURN v_order;
END; $$;

-- 2. Function: Mark Group as Failed / Cancelled
CREATE OR REPLACE FUNCTION mark_group_failed_rpc(
  p_group_id UUID,
  p_reason TEXT DEFAULT 'Group execution failed'
) RETURNS purchase_groups
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group purchase_groups;
BEGIN
  SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand group not found';
  END IF;

  IF v_group.status IN ('FULFILLED', 'CANCELLED', 'FAILED') THEN
    RAISE EXCEPTION 'Group is already in a terminal state';
  END IF;

  UPDATE purchase_groups
  SET status = 'FAILED', updated_at = NOW()
  WHERE id = p_group_id
  RETURNING * INTO v_group;

  INSERT INTO purchase_group_events (group_id, from_status, to_status, reason)
  VALUES (p_group_id, v_group.status, 'FAILED', p_reason);

  RETURN v_group;
END; $$;

-- 3. Enhance process_group_settlement validation
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
  IF p_total_amount <= 0 THEN
    RAISE EXCEPTION 'Settlement amount must be positive';
  END IF;

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

-- 4. Enhance process_value_chain_settlement validation
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
  v_group purchase_groups;
  v_platform_share NUMERIC;
  v_farmer_share NUMERIC;
  v_processor_share NUMERIC;
  v_carrier_share NUMERIC;
  v_depot_share NUMERIC;
BEGIN
  IF p_total_amount <= 0 THEN
    RAISE EXCEPTION 'Settlement amount must be positive';
  END IF;

  SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand group not found';
  END IF;

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

REVOKE ALL ON FUNCTION create_group_order_rpc(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_group_failed_rpc(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION create_group_order_rpc(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_group_failed_rpc(UUID, TEXT) TO service_role;
