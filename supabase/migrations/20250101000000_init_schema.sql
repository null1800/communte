-- ComUnite Database Schema Initialization
-- Migration: 20250101000000_init_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('consumer', 'group_admin', 'platform_admin');
CREATE TYPE group_status AS ENUM ('OPEN', 'FUNDING', 'FUNDED', 'PARTIAL_FUNDED', 'EXTENSION_VOTE', 'CANCELLED', 'COMPLETED');
CREATE TYPE payment_state AS ENUM ('INITIATED', 'AWAITING_PROMPT', 'PENDING', 'SUCCESS', 'FAILED', 'RETRY', 'FAILED_FINAL');
CREATE TYPE wallet_tx_type AS ENUM ('DEPOSIT', 'FREEZE', 'RELEASE', 'REFUND', 'FEE');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED');
CREATE TYPE notification_channel AS ENUM ('SMS', 'EMAIL', 'PUSH', 'WHATSAPP');
CREATE TYPE user_event_type AS ENUM ('AUTH_OTP_VERIFIED', 'USER_UPDATED', 'GROUP_JOINED', 'CONTRIBUTION_MADE', 'MILESTONE_REACHED', 'GROUP_COMPLETED');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'consumer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Events (Append-only Ledger)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type user_event_type NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    price_per_unit NUMERIC(10, 2) NOT NULL CHECK (price_per_unit > 0),
    retail_price_ref NUMERIC(10, 2) NOT NULL CHECK (retail_price_ref > 0),
    unit_name VARCHAR(50) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Product Supplier Configs
CREATE TABLE product_supplier_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    moq_units INT NOT NULL CHECK (moq_units > 0),
    wholesale_price NUMERIC(10, 2) NOT NULL CHECK (wholesale_price > 0),
    lead_time_days INT NOT NULL DEFAULT 1,
    is_preferred BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(product_id, supplier_id)
);

-- 6. Groups Table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    title VARCHAR(150) NOT NULL,
    target_units INT NOT NULL CHECK (target_units > 0),
    funded_units INT NOT NULL DEFAULT 0 CHECK (funded_units >= 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    status group_status NOT NULL DEFAULT 'OPEN',
    deadline TIMESTAMPTZ NOT NULL,
    extension_deadline TIMESTAMPTZ,
    collection_point TEXT NOT NULL,
    coordinator_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Group Events (Append-only Audit)
CREATE TABLE group_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    previous_status group_status,
    new_status group_status NOT NULL,
    actor_id UUID REFERENCES users(id),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Group Members
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    units_requested INT NOT NULL CHECK (units_requested > 0),
    units_allocated INT NOT NULL DEFAULT 0 CHECK (units_allocated >= 0),
    total_amount_due NUMERIC(10, 2) NOT NULL CHECK (total_amount_due >= 0),
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    is_fully_paid BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 9. Contribution Schedules
CREATE TABLE contribution_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    installment_number INT NOT NULL CHECK (installment_number > 0),
    amount_due NUMERIC(10, 2) NOT NULL CHECK (amount_due > 0),
    due_date TIMESTAMPTZ NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMPTZ
);

-- 10. Contributions (Payment Records)
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id),
    user_id UUID NOT NULL REFERENCES users(id),
    schedule_id UUID REFERENCES contribution_schedules(id),
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    phone VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'MTN_MOMO',
    provider_reference VARCHAR(100),
    status payment_state NOT NULL DEFAULT 'INITIATED',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Wallet Transactions (Append-only Ledger)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    group_id UUID REFERENCES groups(id),
    type wallet_tx_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    reference VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
    collection_point TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'PENDING',
    supplier_notified_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Order Events (Append-only Audit)
CREATE TABLE order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    channel notification_channel NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
