import {
  Product,
  ProductOffer,
  PurchaseGroup,
  GroupMembership,
  GroupOrder,
  CreateProductOfferDto,
  CreatePurchaseGroupDto,
  AppRole,
  CollectionPoint,
  TransformationSpec,
  SettlementAllocation,
} from '@communte/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

let memoryToken: string | null = null;

export function setAccessToken(token: string | null) {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('cu_access_token', token);
    } else {
      sessionStorage.removeItem('cu_access_token');
    }
  }
}

export function getAccessToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('cu_access_token');
  }
  return null;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.message || `API error (${res.status})`);
    }
    return data as T;
  } catch (err: any) {
    console.warn(`API call failed for ${url}:`, err.message || err);
    throw err;
  }
}

export const apiClient = {
  // Auth
  async obtainDevelopmentToken(userId: string, roles: AppRole[]): Promise<{ accessToken: string }> {
    const res = await fetchJson<{ accessToken: string }>('/auth/development-token', {
      method: 'POST',
      body: JSON.stringify({ userId, roles }),
    });
    setAccessToken(res.accessToken);
    return res;
  },

  async getProfile(): Promise<{ id: string; roles: AppRole[] }> {
    return fetchJson<{ id: string; roles: AppRole[] }>('/auth/me');
  },

  // Catalog & Products
  async getProducts(): Promise<Product[]> {
    return fetchJson<Product[]>('/products');
  },

  async getCatalogProducts(category?: string): Promise<Product[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return fetchJson<Product[]>(`/catalog/products${query}`);
  },

  async getTransformationSpecs(outputProductId?: string): Promise<TransformationSpec[]> {
    const query = outputProductId ? `?outputProductId=${encodeURIComponent(outputProductId)}` : '';
    return fetchJson<TransformationSpec[]>(`/catalog/transformations${query}`);
  },

  // Collection Points
  async getCollectionPoints(): Promise<CollectionPoint[]> {
    return fetchJson<CollectionPoint[]>('/collection-points');
  },

  async getCollectionPointById(id: string): Promise<CollectionPoint> {
    return fetchJson<CollectionPoint>(`/collection-points/${id}`);
  },

  // Product Offers
  async getProductOffers(): Promise<ProductOffer[]> {
    return fetchJson<ProductOffer[]>('/product-offers');
  },

  async getProductOfferById(id: string): Promise<{ offer: ProductOffer; groups: PurchaseGroup[] }> {
    return fetchJson<{ offer: ProductOffer; groups: PurchaseGroup[] }>(`/product-offers/${id}`);
  },

  async createProductOffer(dto: CreateProductOfferDto): Promise<ProductOffer> {
    return fetchJson<ProductOffer>('/product-offers', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // Purchase / Hybrid Demand Groups
  async getGroups(productOfferId?: string, productId?: string): Promise<PurchaseGroup[]> {
    const params = new URLSearchParams();
    if (productOfferId) params.append('productOfferId', productOfferId);
    if (productId) params.append('productId', productId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<PurchaseGroup[]>(`/groups${query}`);
  },

  async getGroupById(id: string): Promise<{ group: PurchaseGroup; memberships: GroupMembership[] }> {
    return fetchJson<{ group: PurchaseGroup; memberships: GroupMembership[] }>(`/groups/${id}`);
  },

  async createGroup(dto: CreatePurchaseGroupDto): Promise<PurchaseGroup> {
    return fetchJson<PurchaseGroup>('/groups', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async commitToGroup(groupId: string, requestedQuantity: number, idempotencyKey: string): Promise<PurchaseGroup> {
    return fetchJson<PurchaseGroup>(`/groups/${groupId}/commitments`, {
      method: 'POST',
      body: JSON.stringify({ requestedQuantity, idempotencyKey }),
    });
  },

  async fundGroup(groupId: string): Promise<PurchaseGroup> {
    return fetchJson<PurchaseGroup>(`/groups/${groupId}/fund`, {
      method: 'POST',
    });
  },

  // Supply Contracts
  async createSupplyContract(demandGroupId: string, partyProfileId: string, productId: string, contractedQuantity: number, unitPrice: number): Promise<any> {
    return fetchJson<any>('/supply-contracts', {
      method: 'POST',
      body: JSON.stringify({ demandGroupId, partyProfileId, productId, contractedQuantity, unitPrice }),
    });
  },

  async getSupplyContractsForGroup(demandGroupId: string): Promise<any[]> {
    return fetchJson<any[]>(`/supply-contracts/group/${demandGroupId}`);
  },

  // Processing & Batches
  async createProcessingOrder(demandGroupId: string, processorPartyId: string, transformationSpecId: string, inputQuantity: number, outputQuantity: number, millingFee: number): Promise<any> {
    return fetchJson<any>('/processing/orders', {
      method: 'POST',
      body: JSON.stringify({ demandGroupId, processorPartyId, transformationSpecId, inputQuantity, outputQuantity, millingFee }),
    });
  },

  async getProcessingOrdersForGroup(demandGroupId: string): Promise<any> {
    return fetchJson<any>(`/processing/group/${demandGroupId}`);
  },

  // Shipments
  async createShipment(demandGroupId: string, originAddress: string, destinationCollectionPointId: string, quantityUnits: number, carrierPartyId?: string): Promise<any> {
    return fetchJson<any>('/shipments', {
      method: 'POST',
      body: JSON.stringify({ demandGroupId, originAddress, destinationCollectionPointId, quantityUnits, carrierPartyId }),
    });
  },

  async getShipmentsForGroup(demandGroupId: string): Promise<any[]> {
    return fetchJson<any[]>(`/shipments/group/${demandGroupId}`);
  },

  // Multi-Party Settlements
  async getSettlementAllocations(transactionId: string): Promise<SettlementAllocation[]> {
    return fetchJson<SettlementAllocation[]>(`/settlements/transaction/${transactionId}`);
  },

  // Fulfilment & Depot Verification
  async getDepotAllocations(collectionPointId: string): Promise<any> {
    return fetchJson<any>(`/fulfilment/depot/${collectionPointId}`);
  },

  async verifyClaimCode(claimCode: string): Promise<any> {
    return fetchJson<any>('/fulfilment/claim/verify', {
      method: 'POST',
      body: JSON.stringify({ claimCode }),
    });
  },

  // Supplier Profile & Demand
  async getSupplierProfile(): Promise<any> {
    return fetchJson<any>('/supplier/profile');
  },

  async getSupplierDemand(): Promise<any> {
    return fetchJson<any>('/supplier/demand');
  },

  // Orders
  async getOrders(): Promise<GroupOrder[]> {
    return fetchJson<GroupOrder[]>('/orders');
  },

  async updateFulfilmentStatus(orderId: string, status: string): Promise<any> {
    return fetchJson<any>(`/orders/${orderId}/fulfilment`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
