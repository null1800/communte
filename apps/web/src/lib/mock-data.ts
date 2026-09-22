/**
 * ComUnite — Centralised Mock Data
 *
 * Single source of truth for all development/demo data.
 * Replace individual exports with API calls as features mature.
 */

import { Product, PurchaseGroup, GroupMembership, Order, UserSavingsSummary } from '@communte/shared-types';

// ─── Products ──────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: (Product & { icon: string; activeGroups: number })[] = [
  {
    id: 'prod-mealie-meal',
    name: 'Mealie Meal (Breakfast)',
    description: 'National Milling / Eagle brand. Standard household staple.',
    category: 'Grains & Flour',
    unit_name: '25kg bag',
    price_per_unit: 180,
    retail_price_ref: 380,
    savings_percentage: 53,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    icon: 'grain',
    activeGroups: 3,
  },
  {
    id: 'prod-cooking-oil',
    name: 'Refined Cooking Oil',
    description: "D'lite / Zamanita. Household cooking oil.",
    category: 'Cooking & Oils',
    unit_name: '20L container',
    price_per_unit: 240,
    retail_price_ref: 340,
    savings_percentage: 29,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    icon: 'droplets',
    activeGroups: 2,
  },
  {
    id: 'prod-sugar',
    name: 'White Household Sugar',
    description: 'Zambia Sugar. Wholesale 50kg bag.',
    category: 'Sugar & Sweeteners',
    unit_name: '50kg bag',
    price_per_unit: 310,
    retail_price_ref: 410,
    savings_percentage: 24,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    icon: 'cube',
    activeGroups: 2,
  },
  {
    id: 'prod-soap',
    name: 'Laundry Bar Soap',
    description: 'Boom / Trade Kings. Carton of 72 bars.',
    category: 'Cleaning & Hygiene',
    unit_name: 'Carton (72 bars)',
    price_per_unit: 190,
    retail_price_ref: 290,
    savings_percentage: 35,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    icon: 'sparkles',
    activeGroups: 1,
  },
  {
    id: 'prod-salt',
    name: 'Iodized Table Salt',
    description: 'Royal Salt Corp. 25kg bag.',
    category: 'Spices & Seasonings',
    unit_name: '25kg bag',
    price_per_unit: 90,
    retail_price_ref: 150,
    savings_percentage: 40,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    icon: 'circle-dot',
    activeGroups: 1,
  },
  {
    id: 'prod-rice',
    name: 'Long Grain Rice',
    description: 'Premium Zambian rice. 25kg bag.',
    category: 'Grains & Flour',
    unit_name: '25kg bag',
    price_per_unit: 220,
    retail_price_ref: 340,
    savings_percentage: 35,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    icon: 'grain',
    activeGroups: 1,
  },
];

// ─── Groups ─────────────────────────────────────────────────────────────────

export const MOCK_GROUPS: (PurchaseGroup & {
  productName?: string;
  productUnit?: string;
  myContributionUnits?: number;
  collectionPoint?: string;
  // legacy mock fields
  product_id?: string;
  title?: string;
  funded_units?: number;
  target_units?: number;
  unit_price?: number;
  deadline?: string;
  coordinator_id?: string;
})[] = [
  {
    id: 'grp-001',
    product_offer_id: 'prod-cooking-oil',
    product_id: 'prod-cooking-oil',
    title: 'Cooking Oil Group · Lusaka-07',
    productName: 'Refined Cooking Oil',
    productUnit: '20L container',
    target_quantity: 100,
    committed_quantity: 82,
    funded_quantity: 82,
    target_units: 100,
    funded_units: 82,
    unit_price: 240,
    status: 'OPEN',
    created_by_user_id: 'user-001',
    closes_at: new Date(Date.now() + 1.35 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 1.35 * 24 * 60 * 60 * 1000).toISOString(),
    collection_point: 'Chilenje Community Hall',
    collectionPoint: 'Chilenje Community Hall',
    myContributionUnits: 2,
    coordinator_id: 'user-002',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-20T14:00:00Z',
  },
  {
    id: 'grp-002',
    product_offer_id: 'prod-sugar',
    product_id: 'prod-sugar',
    title: 'Sugar Group · Lusaka-03',
    productName: 'White Household Sugar',
    productUnit: '50kg bag',
    target_quantity: 50,
    committed_quantity: 47,
    funded_quantity: 47,
    target_units: 50,
    funded_units: 47,
    unit_price: 310,
    status: 'OPEN',
    created_by_user_id: 'user-003',
    closes_at: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    collection_point: 'Matero Market Point',
    collectionPoint: 'Matero Market Point',
    myContributionUnits: 1,
    created_at: '2024-01-12T09:00:00Z',
    updated_at: '2024-01-21T10:00:00Z',
  },
  {
    id: 'grp-003',
    product_offer_id: 'prod-mealie-meal',
    product_id: 'prod-mealie-meal',
    title: 'Mealie Meal Group · Lusaka-04',
    productName: 'Mealie Meal (Breakfast)',
    productUnit: '25kg bag',
    target_quantity: 20,
    committed_quantity: 14,
    funded_quantity: 14,
    target_units: 20,
    funded_units: 14,
    unit_price: 180,
    status: 'OPEN',
    created_by_user_id: 'user-004',
    closes_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    collection_point: 'Kabulonga Depot',
    collectionPoint: 'Kabulonga Depot',
    myContributionUnits: 0,
    created_at: '2024-01-15T07:00:00Z',
    updated_at: '2024-01-22T08:00:00Z',
  },
  {
    id: 'grp-004',
    product_offer_id: 'prod-soap',
    product_id: 'prod-soap',
    title: 'Soap Group · Lusaka-01',
    productName: 'Laundry Bar Soap',
    productUnit: 'Carton (72 bars)',
    target_quantity: 30,
    committed_quantity: 19,
    funded_quantity: 19,
    target_units: 30,
    funded_units: 19,
    unit_price: 190,
    status: 'OPEN',
    created_by_user_id: 'user-005',
    closes_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    collection_point: 'Woodlands Community Centre',
    collectionPoint: 'Woodlands Community Centre',
    myContributionUnits: 0,
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-23T09:00:00Z',
  },
];

// Groups the current user has joined
export const MY_ACTIVE_GROUPS = MOCK_GROUPS.filter(g => (g.myContributionUnits ?? 0) > 0);

// Groups the user hasn't joined but are near completion (>= 60%)
export const NEAR_COMPLETION_GROUPS = MOCK_GROUPS.filter(
  g => (g.myContributionUnits ?? 0) === 0 && ((g.committed_quantity ?? 0) / (g.target_quantity ?? 1)) >= 0.6,
);

// ─── Members (for group detail) ─────────────────────────────────────────────

export const MOCK_MEMBERS: (GroupMembership & {
  units_requested?: number;
  units_allocated?: number;
  total_amount_due?: number;
  amount_paid?: number;
  is_fully_paid?: boolean;
  joined_at?: string;
})[] = [
  {
    id: 'm1',
    group_id: 'grp-001',
    customer_user_id: 'user-001',
    user_id: 'user-001',
    requested_quantity: 2,
    committed_quantity: 2,
    status: 'ACTIVE',
    units_requested: 2,
    units_allocated: 2,
    amount_due: 480,
    total_amount_due: 480,
    amount_paid: 480,
    is_fully_paid: true,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
    joined_at: '2024-01-10T09:00:00Z',
    user: { name: 'Bwembya Mutale (You)', phone: '+260 977 842 109' },
  },
  {
    id: 'm2',
    group_id: 'grp-001',
    customer_user_id: 'user-002',
    user_id: 'user-002',
    requested_quantity: 3,
    committed_quantity: 3,
    status: 'ACTIVE',
    units_requested: 3,
    units_allocated: 3,
    amount_due: 720,
    total_amount_due: 720,
    amount_paid: 720,
    is_fully_paid: true,
    created_at: '2024-01-10T09:30:00Z',
    updated_at: '2024-01-10T09:30:00Z',
    joined_at: '2024-01-10T09:30:00Z',
    user: { name: 'Chanda K.' },
  },
  {
    id: 'm3',
    group_id: 'grp-001',
    customer_user_id: 'user-003',
    user_id: 'user-003',
    requested_quantity: 2,
    committed_quantity: 2,
    status: 'ACTIVE',
    units_requested: 2,
    units_allocated: 2,
    amount_due: 480,
    total_amount_due: 480,
    amount_paid: 480,
    is_fully_paid: true,
    created_at: '2024-01-11T08:00:00Z',
    updated_at: '2024-01-11T08:00:00Z',
    joined_at: '2024-01-11T08:00:00Z',
    user: { name: 'Mutale P.' },
  },
  {
    id: 'm4',
    group_id: 'grp-001',
    customer_user_id: 'user-004',
    user_id: 'user-004',
    requested_quantity: 4,
    committed_quantity: 4,
    status: 'ACTIVE',
    units_requested: 4,
    units_allocated: 4,
    amount_due: 960,
    total_amount_due: 960,
    amount_paid: 960,
    is_fully_paid: true,
    created_at: '2024-01-11T11:00:00Z',
    updated_at: '2024-01-11T11:00:00Z',
    joined_at: '2024-01-11T11:00:00Z',
    user: { name: 'Mulenga Z.' },
  },
  {
    id: 'm5',
    group_id: 'grp-001',
    customer_user_id: 'user-005',
    user_id: 'user-005',
    requested_quantity: 2,
    committed_quantity: 2,
    status: 'ACTIVE',
    units_requested: 2,
    units_allocated: 2,
    amount_due: 480,
    total_amount_due: 480,
    amount_paid: 0,
    is_fully_paid: false,
    created_at: '2024-01-12T14:00:00Z',
    updated_at: '2024-01-12T14:00:00Z',
    joined_at: '2024-01-12T14:00:00Z',
    user: { name: 'Kabwe S.' },
  },
  {
    id: 'm6',
    group_id: 'grp-001',
    customer_user_id: 'user-006',
    user_id: 'user-006',
    requested_quantity: 4,
    committed_quantity: 4,
    status: 'ACTIVE',
    units_requested: 4,
    units_allocated: 4,
    amount_due: 960,
    total_amount_due: 960,
    amount_paid: 0,
    is_fully_paid: false,
    created_at: '2024-01-13T09:00:00Z',
    updated_at: '2024-01-13T09:00:00Z',
    joined_at: '2024-01-13T09:00:00Z',
    user: { name: 'Njobvu T.' },
  },
];

// ─── Completed Orders ────────────────────────────────────────────────────────

export const MOCK_ORDERS: (Order & {
  productName?: string;
  productUnit?: string;
  product_id?: string;
  supplier_id?: string;
  total_price?: number;
  supplier_notified_at?: string;
  updated_at?: string;
})[] = [
  {
    id: 'ord-001',
    group_id: 'grp-completed-01',
    product_offer_id: 'prod-mealie-meal',
    supplier_profile_id: 'sup-001',
    supplier_id: 'sup-001',
    product_id: 'prod-mealie-meal',
    productName: 'Mealie Meal (Breakfast)',
    productUnit: '25kg bag',
    quantity: 2,
    unit_price: 180,
    total_amount: 360,
    total_price: 360,
    collection_point: 'Chilenje Community Hall',
    status: 'DELIVERED',
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-08T14:00:00Z',
    supplier_notified_at: '2024-01-05T10:00:00Z',
    confirmed_at: '2024-01-05T12:00:00Z',
    dispatched_at: '2024-01-07T08:00:00Z',
    delivered_at: '2024-01-08T14:00:00Z',
  },
  {
    id: 'ord-002',
    group_id: 'grp-completed-02',
    product_offer_id: 'prod-cooking-oil',
    supplier_profile_id: 'sup-002',
    supplier_id: 'sup-002',
    product_id: 'prod-cooking-oil',
    productName: 'Refined Cooking Oil',
    productUnit: '20L container',
    quantity: 1,
    unit_price: 240,
    total_amount: 240,
    total_price: 240,
    collection_point: 'Matero Market Point',
    status: 'DISPATCHED',
    created_at: '2024-01-18T09:00:00Z',
    updated_at: '2024-01-21T11:00:00Z',
    supplier_notified_at: '2024-01-18T11:00:00Z',
    confirmed_at: '2024-01-19T09:00:00Z',
    dispatched_at: '2024-01-21T08:00:00Z',
  },
];

// ─── Savings Summary ─────────────────────────────────────────────────────────

export const MOCK_SAVINGS: UserSavingsSummary = {
  user_id: 'user-001',
  lifetime_savings: 684.50,
  groups_completed: 3,
  current_streak: 4,
  longest_streak: 7,
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'grains',   label: 'Grains & Flour',       icon: 'wheat' },
  { id: 'oils',     label: 'Cooking & Oils',        icon: 'droplets' },
  { id: 'sugar',    label: 'Sugar & Sweeteners',    icon: 'candy' },
  { id: 'cleaning', label: 'Cleaning & Hygiene',    icon: 'sparkles' },
  { id: 'spices',   label: 'Spices & Seasonings',   icon: 'leaf' },
  { id: 'dairy',    label: 'Dairy & Eggs',           icon: 'milk' },
  { id: 'pulses',   label: 'Pulses & Legumes',      icon: 'bean' },
  { id: 'beverages',label: 'Beverages',             icon: 'coffee' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getGroupProgress(group: PurchaseGroup & { funded_units?: number; target_units?: number }) {
  const funded = group.committed_quantity ?? group.funded_units ?? 0;
  const target = group.target_quantity ?? group.target_units ?? 1;
  const pct = Math.round((funded / target) * 100);
  const remaining = target - funded;
  return { pct, remaining };
}

export function formatDeadline(isoDate: string): string {
  const now = Date.now();
  const deadline = new Date(isoDate).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) return 'Closed';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Closing soon';
}

export function formatCurrency(amount: number): string {
  return `ZMW ${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
