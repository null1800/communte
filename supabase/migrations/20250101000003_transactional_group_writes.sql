-- Canonical write boundary for the initial vertical slice.
-- These functions run as one PostgreSQL transaction; the API never reconstructs
-- allocation state in memory or accepts an actor ID from a browser request.

ALTER TABLE group_memberships ADD COLUMN client_request_id UUID;
ALTER TABLE group_memberships ADD CONSTRAINT group_memberships_client_request_key UNIQUE (client_request_id);
ALTER TABLE group_memberships ALTER COLUMN client_request_id SET NOT NULL;

CREATE OR REPLACE FUNCTION create_product_offer(
  p_actor_user_id UUID, p_product_id UUID, p_unit_name TEXT,
  p_available_quantity INTEGER, p_minimum_order_quantity INTEGER,
  p_unit_price NUMERIC, p_fulfilment_terms TEXT, p_availability_ends_at TIMESTAMPTZ DEFAULT NULL
) RETURNS product_offers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_supplier supplier_profiles; v_offer product_offers;
BEGIN
  SELECT * INTO v_supplier FROM supplier_profiles
  WHERE user_id = p_actor_user_id AND status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active supplier profile required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND is_active) THEN RAISE EXCEPTION 'Product not found or inactive'; END IF;
  IF p_available_quantity <= 0 OR p_minimum_order_quantity <= 0 OR p_unit_price <= 0 THEN RAISE EXCEPTION 'Offer quantity and price must be positive'; END IF;
  INSERT INTO product_offers (supplier_profile_id, product_id, unit_name, available_quantity, minimum_order_quantity, unit_price, fulfilment_terms, availability_ends_at, status)
  VALUES (v_supplier.id, p_product_id, p_unit_name, p_available_quantity, p_minimum_order_quantity, p_unit_price, p_fulfilment_terms, p_availability_ends_at, 'PUBLISHED')
  RETURNING * INTO v_offer;
  RETURN v_offer;
END; $$;

CREATE OR REPLACE FUNCTION create_purchase_group(
  p_actor_user_id UUID, p_product_offer_id UUID, p_title TEXT,
  p_target_quantity INTEGER, p_collection_point TEXT, p_closes_at TIMESTAMPTZ
) RETURNS purchase_groups
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_offer product_offers; v_group purchase_groups;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_actor_user_id AND is_active) THEN RAISE EXCEPTION 'Authenticated user is not active'; END IF;
  SELECT * INTO v_offer FROM product_offers WHERE id = p_product_offer_id FOR UPDATE;
  IF NOT FOUND OR v_offer.status <> 'PUBLISHED' THEN RAISE EXCEPTION 'Product offer is unavailable'; END IF;
  IF v_offer.availability_ends_at IS NOT NULL AND v_offer.availability_ends_at <= now() THEN RAISE EXCEPTION 'Product offer has expired'; END IF;
  IF p_target_quantity < v_offer.minimum_order_quantity OR p_target_quantity > v_offer.available_quantity - v_offer.reserved_quantity THEN RAISE EXCEPTION 'Group target is outside the available offer quantity'; END IF;
  IF p_closes_at <= now() OR (v_offer.availability_ends_at IS NOT NULL AND p_closes_at > v_offer.availability_ends_at) THEN RAISE EXCEPTION 'Group closing time is invalid'; END IF;
  INSERT INTO purchase_groups (product_offer_id, created_by_user_id, title, target_quantity, unit_price, collection_point, closes_at, status)
  VALUES (v_offer.id, p_actor_user_id, p_title, p_target_quantity, v_offer.unit_price, p_collection_point, p_closes_at, 'OPEN') RETURNING * INTO v_group;
  INSERT INTO purchase_group_events (group_id, to_status, actor_user_id, reason) VALUES (v_group.id, 'OPEN', p_actor_user_id, 'Group created');
  RETURN v_group;
END; $$;

CREATE OR REPLACE FUNCTION commit_group_membership(
  p_actor_user_id UUID, p_group_id UUID, p_requested_quantity INTEGER, p_idempotency_key UUID
) RETURNS purchase_groups
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_group purchase_groups; v_offer product_offers; v_existing group_memberships;
BEGIN
  SELECT * INTO v_existing FROM group_memberships WHERE client_request_id = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.customer_user_id <> p_actor_user_id OR v_existing.group_id <> p_group_id THEN RAISE EXCEPTION 'Idempotency key was used for a different request'; END IF;
    SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id; RETURN v_group;
  END IF;

  IF p_requested_quantity <= 0 THEN RAISE EXCEPTION 'Requested quantity must be positive'; END IF;

  SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Group not found'; END IF;
  IF v_group.status <> 'OPEN' OR v_group.closes_at <= now() THEN RAISE EXCEPTION 'Group is not open for commitments'; END IF;
  IF v_group.committed_quantity + p_requested_quantity > v_group.target_quantity THEN RAISE EXCEPTION 'Requested quantity exceeds remaining group target'; END IF;

  IF v_group.product_offer_id IS NOT NULL THEN
    SELECT * INTO v_offer FROM product_offers WHERE id = v_group.product_offer_id FOR UPDATE;
    IF NOT FOUND OR v_offer.status <> 'PUBLISHED' OR v_offer.reserved_quantity + p_requested_quantity > v_offer.available_quantity THEN RAISE EXCEPTION 'Insufficient offer inventory'; END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM group_memberships WHERE group_id = p_group_id AND customer_user_id = p_actor_user_id) THEN RAISE EXCEPTION 'Customer already has a membership in this group'; END IF;

  BEGIN
    INSERT INTO group_memberships (group_id, customer_user_id, requested_quantity, committed_quantity, amount_due, client_request_id)
    VALUES (p_group_id, p_actor_user_id, p_requested_quantity, p_requested_quantity, p_requested_quantity * v_group.unit_price, p_idempotency_key);
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_existing FROM group_memberships WHERE client_request_id = p_idempotency_key;
    IF FOUND THEN
      IF v_existing.customer_user_id <> p_actor_user_id OR v_existing.group_id <> p_group_id THEN RAISE EXCEPTION 'Idempotency key was used for a different request'; END IF;
      SELECT * INTO v_group FROM purchase_groups WHERE id = p_group_id; RETURN v_group;
    END IF;
    RAISE EXCEPTION 'Customer already has a membership in this group';
  END;

  IF v_group.product_offer_id IS NOT NULL THEN
    UPDATE product_offers SET reserved_quantity = reserved_quantity + p_requested_quantity, updated_at = now() WHERE id = v_offer.id;
  END IF;

  UPDATE purchase_groups SET committed_quantity = committed_quantity + p_requested_quantity,
    status = CASE WHEN committed_quantity + p_requested_quantity = target_quantity THEN 'TARGET_REACHED' ELSE 'OPEN' END,
    version = version + 1, updated_at = now() WHERE id = v_group.id RETURNING * INTO v_group;

  IF v_group.status = 'TARGET_REACHED' THEN INSERT INTO purchase_group_events (group_id, from_status, to_status, actor_user_id, reason) VALUES (v_group.id, 'OPEN', 'TARGET_REACHED', p_actor_user_id, 'Committed quantity reached target'); END IF;

  RETURN v_group;
END; $$;

REVOKE ALL ON FUNCTION create_product_offer(UUID, UUID, TEXT, INTEGER, INTEGER, NUMERIC, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_purchase_group(UUID, UUID, TEXT, INTEGER, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION commit_group_membership(UUID, UUID, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_product_offer(UUID, UUID, TEXT, INTEGER, INTEGER, NUMERIC, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION create_purchase_group(UUID, UUID, TEXT, INTEGER, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION commit_group_membership(UUID, UUID, INTEGER, UUID) TO service_role;
