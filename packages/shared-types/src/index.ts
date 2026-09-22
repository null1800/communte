/**
 * ComUnite / Project Umoja - Shared Domain Types & Interfaces
 */

// Roles & Actor Profiles
export type AppRole = 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';
export type UserRole = 'consumer' | 'group_admin' | 'platform_admin' | AppRole;
export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'FARMER' | 'PROCESSOR' | 'CARRIER' | 'DEPOT_OPERATOR';
export type FulfillmentMode = 'MODEL_A_DIRECT' | 'MODEL_B_VALUE_CHAIN';
export type SupplyContractStatus = 'DRAFT' | 'COMMITTED' | 'FULFILLED' | 'CANCELLED';
export type ProcessingOrderStatus = 'PLANNED' | 'INPUT_RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AllocationType = 'RAW_SUPPLY' | 'PROCESSING_FEE' | 'PACKAGING' | 'LOGISTICS_FEE' | 'DEPOT_COMMISSION' | 'PLATFORM_FEE';
export type AllocationStatus = 'ESCROW_HELD' | 'READY_FOR_DISBURSEMENT' | 'DISBURSED' | 'REFUNDED';
export type ClaimStatus = 'UNCLAIMED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  phone: string;
  name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  operator_user_id?: string;
  capacity_units: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartyProfile {
  id: string;
  user_id: string;
  party_type: PartyType;
  legal_name: string;
  contact_phone: string;
  contact_email?: string;
  address: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

// Legacy SupplierProfile interface alias for backwards compatibility
export type SupplierProfile = PartyProfile;

export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email?: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Catalog Product Model & Transformation Specs
export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price_per_unit: number; // Base reference price in ZMW
  retail_price_ref: number; // Retail reference price in ZMW
  savings_percentage?: number; // Computed: ((retail - wholesale) / retail) * 100
  unit_name: string; // e.g. "25kg bag", "20L bottle"
  image_url?: string;
  is_raw_material?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransformationSpec {
  id: string;
  input_raw_product_id: string;
  output_product_id: string;
  conversion_ratio: number;
  processing_cost_per_unit: number;
  yield_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Offer Status & Entity
export type ProductOfferStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';

export interface ProductOffer {
  id: string;
  supplier_profile_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  product_id: string;
  title?: string;
  description?: string;
  category?: string;
  unit_name: string;
  available_quantity: number;
  reserved_quantity?: number;
  allocated_quantity?: number;
  minimum_order_quantity: number;
  moq_units?: number;
  unit_price: number;
  wholesale_price?: number;
  retail_reference_price?: number;
  retail_price_ref?: number;
  savings_percentage?: number;
  default_target_units?: number;
  availability_starts_at?: string;
  availability_ends_at?: string;
  fulfilment_terms?: string;
  image_url?: string;
  status: ProductOfferStatus;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  products?: Product;
  supplier_profiles?: SupplierProfile;
}

export interface CreateProductOfferDto {
  productId: string;
  unitName: string;
  availableQuantity: number;
  minimumOrderQuantity: number;
  unitPrice: number;
  fulfilmentTerms: string;
  availabilityEndsAt?: string;
}

// Purchase / Demand Group Status & Entity
export type PurchaseGroupStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'TARGET_REACHED'
  | 'PROCESSING'
  | 'ORDER_CREATED'
  | 'FULFILLED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED';

export type GroupStatus = PurchaseGroupStatus | 'FUNDING' | 'FUNDED' | 'PARTIAL_FUNDED' | 'EXTENSION_VOTE' | 'COMPLETED';

export interface PurchaseGroup {
  id: string;
  product_offer_id?: string;
  product_id?: string;
  collection_point_id?: string;
  created_by_user_id: string;
  title: string;
  target_quantity: number;
  committed_quantity: number;
  funded_quantity: number;
  unit_price: number;
  collection_point: string;
  closes_at: string;
  status: PurchaseGroupStatus;
  fulfillment_mode?: FulfillmentMode;
  version?: number;
  created_at: string;
  updated_at: string;
  product_offer?: ProductOffer;
  product?: Product;
  collection_point_node?: CollectionPoint;
}

export type DemandGroup = PurchaseGroup;
export type Group = PurchaseGroup;

export interface CreatePurchaseGroupDto {
  productId?: string;
  productOfferId?: string;
  collectionPointId?: string;
  title: string;
  targetQuantity: number;
  unitPrice?: number;
  collectionPoint?: string;
  closesAt: string;
  fulfillmentMode?: FulfillmentMode;
}

// Group Membership / Demand Contribution
export type MembershipStatus = 'ACTIVE' | 'CANCELLED' | 'FULFILLED';

export interface GroupMembership {
  id: string;
  group_id: string;
  customer_user_id: string;
  user_id?: string;
  requested_quantity: number;
  committed_quantity: number;
  units_requested?: number;
  units_allocated?: number;
  amount_due: number;
  total_amount_due?: number;
  amount_paid?: number;
  is_fully_paid?: boolean;
  status: MembershipStatus;
  client_request_id?: string;
  created_at: string;
  updated_at?: string;
  user?: Partial<User>;
}

export type DemandContribution = GroupMembership;
export type GroupMember = GroupMembership;

export interface CommitGroupMembershipDto {
  requestedQuantity: number;
  idempotencyKey: string;
}

export interface GroupEvent {
  id: string;
  group_id: string;
  from_status?: PurchaseGroupStatus;
  to_status: PurchaseGroupStatus;
  actor_user_id?: string;
  reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Value Chain Entities (Supply Contracts, Processing Orders, Settlement Ledgers, Customer Allocations)
export interface SupplyContract {
  id: string;
  demand_group_id: string;
  party_profile_id: string;
  product_id: string;
  contracted_quantity: number;
  unit_price: number;
  status: SupplyContractStatus;
  created_at: string;
  updated_at: string;
}

export interface ProcessingOrder {
  id: string;
  demand_group_id: string;
  processor_party_id: string;
  transformation_spec_id: string;
  input_quantity: number;
  output_quantity: number;
  milling_fee_total: number;
  status: ProcessingOrderStatus;
  created_at: string;
  updated_at: string;
}

export interface SettlementAllocation {
  id: string;
  payment_transaction_id: string;
  recipient_party_id?: string;
  allocation_type: AllocationType;
  amount: number;
  status: AllocationStatus;
  created_at: string;
  settled_at?: string;
}

export interface CustomerAllocation {
  id: string;
  membership_id: string;
  claim_code: string;
  status: ClaimStatus;
  claimed_at?: string;
  created_at: string;
}

export type ShipmentStatus = 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED' | 'RECEIVED';
export type ProcessingBatchStatus = 'INPUT_RECEIVED' | 'PROCESSING' | 'QA_FAILED' | 'QA_PASSED' | 'PACKAGED' | 'COMPLETED';

export interface Shipment {
  id: string;
  demand_group_id: string;
  carrier_party_id?: string;
  origin_address: string;
  destination_collection_point_id: string;
  quantity_units: number;
  status: ShipmentStatus;
  tracking_number?: string;
  dispatched_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessingBatch {
  id: string;
  processing_order_id: string;
  processor_party_id: string;
  raw_input_quantity_kg: number;
  actual_output_quantity_units: number;
  waste_loss_kg: number;
  qa_notes?: string;
  status: ProcessingBatchStatus;
  created_at: string;
  updated_at: string;
}

// Orders & Fulfilments
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED';
export type FulfilmentStatus = 'PENDING' | 'READY_FOR_COLLECTION' | 'DISPATCHED' | 'DELIVERED' | 'FAILED';

export interface GroupOrder {
  id: string;
  group_id: string;
  product_offer_id: string;
  supplier_profile_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  total_price?: number;
  status?: OrderStatus | string;
  collection_point?: string;
  confirmed_at?: string;
  dispatched_at?: string;
  delivered_at?: string;
  created_at: string;
  fulfilment?: Fulfilment;
}

export interface Fulfilment {
  id: string;
  order_id: string;
  status: FulfilmentStatus;
  collection_point: string;
  tracking_reference?: string;
  ready_at?: string;
  dispatched_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export type Order = GroupOrder;

// Payment Transactions & Audit Ledger
export type PaymentState =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED'
  | 'INITIATED'
  | 'AWAITING_PROMPT'
  | 'RETRY'
  | 'FAILED_FINAL';

export interface PaymentTransaction {
  id: string;
  membership_id: string;
  idempotency_key: string;
  provider: string;
  provider_reference?: string;
  amount: number;
  currency: string;
  initial_status: PaymentState;
  provider_payload?: Record<string, any>;
  created_at: string;
  settled_at?: string;
}

export interface UserSavingsSummary {
  user_id: string;
  lifetime_savings: number;
  groups_completed: number;
  current_streak: number;
  longest_streak: number;
}

// Integration Provider Interfaces
export interface CollectionResult {
  success: boolean;
  providerReference: string;
  status: PaymentState;
  message?: string;
}

export interface PaymentStatusResult {
  status: PaymentState;
  providerReference: string;
  rawResponse?: any;
}

export interface DisbursementResult {
  success: boolean;
  disbursementReference: string;
  message?: string;
}

export interface PaymentProviderInterface {
  initiateCollection(amount: number, phone: string, reference: string, idempotencyKey: string): Promise<CollectionResult>;
  checkStatus(providerReference: string): Promise<PaymentStatusResult>;
  initiateDisbursement(amount: number, phone: string, reference: string): Promise<DisbursementResult>;
  validateWebhook(payload: any, headers: Record<string, string>): boolean;
}

export interface NotificationChannelInterface {
  sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string }>;
  sendEmail?(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string }>;
}
