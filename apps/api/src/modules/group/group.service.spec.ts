import { GroupService } from './group.service';
import { DatabaseService } from '../database/database.service';

describe('GroupService', () => {
  let service: GroupService;
  let dbMock: Partial<DatabaseService>;

  beforeEach(() => {
    dbMock = {
      rpc: jest.fn(),
      select: jest.fn(),
    };
    service = new GroupService(dbMock as DatabaseService);
  });

  it('should call create_hybrid_demand_group RPC for Model B demand-first groups', async () => {
    const mockResult = { id: 'group-b-1', status: 'OPEN', fulfillment_mode: 'MODEL_B_VALUE_CHAIN' };
    (dbMock.rpc as jest.Mock).mockResolvedValue(mockResult);

    const input = {
      productId: 'prod-mealie-meal',
      collectionPointId: 'cp-chilenje-1',
      title: 'Mealie Meal Group · Chilenje',
      targetQuantity: 100,
      unitPrice: 180,
      closesAt: '2026-10-01T00:00:00.000Z',
      fulfillmentMode: 'MODEL_B_VALUE_CHAIN' as const,
    };

    const res = await service.create('user-100', input);
    expect(res).toEqual(mockResult);
    expect(dbMock.rpc).toHaveBeenCalledWith('create_hybrid_demand_group', {
      p_actor_user_id: 'user-100',
      p_product_id: 'prod-mealie-meal',
      p_product_offer_id: null,
      p_collection_point_id: 'cp-chilenje-1',
      p_title: 'Mealie Meal Group · Chilenje',
      p_target_quantity: 100,
      p_unit_price: 180,
      p_closes_at: '2026-10-01T00:00:00.000Z',
      p_fulfillment_mode: 'MODEL_B_VALUE_CHAIN',
    });
  });

  it('should call create_purchase_group RPC for legacy offer-bound groups', async () => {
    const mockResult = { id: 'group-1', status: 'OPEN' };
    (dbMock.rpc as jest.Mock).mockResolvedValue(mockResult);

    const input = {
      productOfferId: 'offer-1',
      title: 'Bulk Eagle Mealimeal Group',
      targetQuantity: 50,
      collectionPoint: 'Kalingalinga Market Hub',
      closesAt: '2026-10-01T00:00:00.000Z',
    };

    const res = await service.create('user-100', input);
    expect(res).toEqual(mockResult);
    expect(dbMock.rpc).toHaveBeenCalledWith('create_purchase_group', {
      p_actor_user_id: 'user-100',
      p_product_offer_id: 'offer-1',
      p_title: 'Bulk Eagle Mealimeal Group',
      p_target_quantity: 50,
      p_collection_point: 'Kalingalinga Market Hub',
      p_closes_at: '2026-10-01T00:00:00.000Z',
    });
  });

  it('should call commit_group_membership RPC with idempotency key', async () => {
    const mockGroup = { id: 'group-1', status: 'OPEN', committed_quantity: 10 };
    (dbMock.rpc as jest.Mock).mockResolvedValue(mockGroup);

    const res = await service.commit('user-100', 'group-1', 10, 'key-uuid-999');
    expect(res).toEqual(mockGroup);
    expect(dbMock.rpc).toHaveBeenCalledWith('commit_group_membership', {
      p_actor_user_id: 'user-100',
      p_group_id: 'group-1',
      p_requested_quantity: 10,
      p_idempotency_key: 'key-uuid-999',
    });
  });
});
