-- ComUnite Row-Level Security & Immutability Policies
-- Migration: 20250101000001_rls_and_immutability.sql

-- Enable RLS on ALL tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_supplier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Default Deny Policies (implicit by enabling RLS without grants, but explicit policies created below)

-- 1. Public Reads for Active Products (Unauthenticated Catalog View)
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

-- 2. User Self-Access Policies
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 3. Group Public Reads & Authenticated Group Membership
CREATE POLICY "Public can view open/active groups" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Members can view their group membership" ON group_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can join groups" ON group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Contribution Schedule Self-Read
CREATE POLICY "Members can view own contribution schedules" ON contribution_schedules
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Immutability Enforcement Functions & Triggers
CREATE OR REPLACE FUNCTION prevent_immutable_table_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Table % is append-only. UPDATE and DELETE operations are strictly forbidden.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Enforce Immutability Trigger on wallet_transactions
CREATE TRIGGER wallet_transactions_immutable_trigger
BEFORE UPDATE OR DELETE ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();

-- Enforce Immutability Trigger on group_events
CREATE TRIGGER group_events_immutable_trigger
BEFORE UPDATE OR DELETE ON group_events
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();

-- Enforce Immutability Trigger on user_events
CREATE TRIGGER user_events_immutable_trigger
BEFORE UPDATE OR DELETE ON user_events
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();

-- Enforce Immutability Trigger on order_events
CREATE TRIGGER order_events_immutable_trigger
BEFORE UPDATE OR DELETE ON order_events
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_table_modification();

-- 6. Service Role Policies (Full access for API backend execution)
CREATE POLICY "Service role full access on users" ON users TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_events" ON user_events TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on products" ON products TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on suppliers" ON suppliers TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on product_supplier_configs" ON product_supplier_configs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on groups" ON groups TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on group_events" ON group_events TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on group_members" ON group_members TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on contribution_schedules" ON contribution_schedules TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on contributions" ON contributions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on wallet_transactions" ON wallet_transactions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on orders" ON orders TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on order_events" ON order_events TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on notifications" ON notifications TO service_role USING (true) WITH CHECK (true);
