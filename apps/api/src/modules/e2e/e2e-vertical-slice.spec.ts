import { GroupService } from '../group/group.service';
import { SupplyContractService } from '../supply-contract/supply-contract.service';
import { ProcessingService } from '../processing/processing.service';
import { ShipmentService } from '../shipment/shipment.service';
import { FulfilmentService } from '../fulfilment/fulfilment.service';
import { SettlementService } from '../settlement/settlement.service';
import { DatabaseService } from '../database/database.service';

describe('ComUnite End-to-End Vertical Slice: Mealie Meal Value Chain (Model B)', () => {
  let dbMock: jest.Mocked<DatabaseService>;
  let groupService: GroupService;
  let supplyContractService: SupplyContractService;
  let processingService: ProcessingService;
  let shipmentService: ShipmentService;
  let fulfilmentService: FulfilmentService;
  let settlementService: SettlementService;

  beforeEach(() => {
    dbMock = {
      rpc: jest.fn(),
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    groupService = new GroupService(dbMock);
    supplyContractService = new SupplyContractService(dbMock);
    processingService = new ProcessingService(dbMock);
    shipmentService = new ShipmentService(dbMock);
    fulfilmentService = new FulfilmentService(dbMock);
    settlementService = new SettlementService(dbMock);
  });

  it('should execute complete Mealie Meal lifecycle from Demand -> Funding -> Supply -> Milling -> Shipment -> Depot Claim -> Multi-Party Settlement', async () => {
    // 1. Create Demand Group for Mealie Meal 25kg (Model B Value Chain)
    const mockGroup = {
      id: 'grp-mealie-001',
      title: 'Mealie Meal 25kg Group Sourcing · Chilenje Depot',
      product_id: 'prod-mealie-meal-25kg',
      collection_point_id: 'cp-chilenje-depot',
      target_quantity: 100,
      committed_quantity: 0,
      unit_price: 180,
      fulfillment_mode: 'MODEL_B_VALUE_CHAIN',
      status: 'OPEN',
    };
    dbMock.rpc.mockResolvedValueOnce(mockGroup);

    const createdGroup: any = await groupService.create('user-consumer-leader', {
      productId: 'prod-mealie-meal-25kg',
      collectionPointId: 'cp-chilenje-depot',
      title: 'Mealie Meal 25kg Group Sourcing · Chilenje Depot',
      targetQuantity: 100,
      unitPrice: 180,
      closesAt: '2026-10-15T00:00:00Z',
      fulfillmentMode: 'MODEL_B_VALUE_CHAIN',
    });
    expect(createdGroup.status).toBe('OPEN');
    expect(dbMock.rpc).toHaveBeenCalledWith('create_hybrid_demand_group', expect.anything());

    // 2. Commitments & Funding
    const fundedGroup = { ...mockGroup, committed_quantity: 100, funded_quantity: 100, status: 'FUNDED' };
    dbMock.rpc.mockResolvedValueOnce(fundedGroup);

    const funded: any = await groupService.fundGroup('grp-mealie-001', 'user-admin');
    expect(funded.status).toBe('FUNDED');
    expect(dbMock.rpc).toHaveBeenCalledWith('fund_demand_group_and_allocate', {
      p_group_id: 'grp-mealie-001',
      p_actor_user_id: 'user-admin',
    });

    // 3. Supply Contract with Farmer / Cooperative for Raw Maize
    const mockContract = {
      id: 'contract-maize-001',
      demand_group_id: 'grp-mealie-001',
      party_profile_id: 'party-farmer-coop-lusaka',
      product_id: 'prod-raw-maize-kg',
      contracted_quantity: 14000, // 14,000 kg raw maize for 100 bags (140kg raw/25kg bag ratio)
      unit_price: 1.25,
      status: 'COMMITTED',
    };
    dbMock.rpc.mockResolvedValueOnce(mockContract);

    const contract: any = await supplyContractService.createContract({
      demandGroupId: 'grp-mealie-001',
      partyProfileId: 'party-farmer-coop-lusaka',
      productId: 'prod-raw-maize-kg',
      contractedQuantity: 14000,
      unitPrice: 1.25,
    });
    expect(contract.status).toBe('COMMITTED');

    // 4. Processing Order & QA Batch Completion with Milling Processor
    const mockProcOrder = {
      id: 'proc-order-001',
      demand_group_id: 'grp-mealie-001',
      processor_party_id: 'party-national-milling-ltd',
      transformation_spec_id: 'spec-maize-to-mealie-meal',
      input_quantity: 14000,
      output_quantity: 100,
      milling_fee_total: 2700,
      status: 'PROCESSING',
    };
    dbMock.rpc.mockResolvedValueOnce(mockProcOrder);

    const procOrder: any = await processingService.createOrderAndBatch({
      demandGroupId: 'grp-mealie-001',
      processorPartyId: 'party-national-milling-ltd',
      transformationSpecId: 'spec-maize-to-mealie-meal',
      inputQuantity: 14000,
      outputQuantity: 100,
      millingFee: 2700,
    });
    expect(procOrder.output_quantity).toBe(100);

    // 5. Logistics Shipment to Chilenje Depot
    const mockShipment = {
      id: 'shipment-001',
      demand_group_id: 'grp-mealie-001',
      carrier_party_id: 'party-swift-trans-ltd',
      origin_address: 'National Milling Plant 2, Industrial Area, Lusaka',
      destination_collection_point_id: 'cp-chilenje-depot',
      quantity_units: 100,
      status: 'IN_TRANSIT',
      tracking_number: 'TRK-MEALIE-001',
      dispatched_at: new Date().toISOString(),
    };
    dbMock.insert.mockResolvedValueOnce([mockShipment]);

    const shipment: any = await shipmentService.createShipment({
      demandGroupId: 'grp-mealie-001',
      carrierPartyId: 'party-swift-trans-ltd',
      originAddress: 'National Milling Plant 2, Industrial Area, Lusaka',
      destinationCollectionPointId: 'cp-chilenje-depot',
      quantityUnits: 100,
    });
    expect(shipment.status).toBe('IN_TRANSIT');

    // 6. Depot Customer Claim Code Verification & Handover
    const mockAllocation = {
      id: 'alloc-001',
      membership_id: 'mem-001',
      claim_code: 'CU-MEALIE88',
      status: 'UNCLAIMED',
    };
    dbMock.select.mockResolvedValueOnce([mockAllocation]);
    dbMock.update.mockResolvedValueOnce([{ ...mockAllocation, status: 'CLAIMED', claimed_at: new Date().toISOString() }]);

    const claimResult = await fulfilmentService.verifyClaimCode('CU-MEALIE88');
    expect(claimResult.message).toContain('Claim code verified successfully!');

    // 7. Multi-Party Settlement Split Execution
    const mockSettlements = [
      { allocation_type: 'PLATFORM_FEE', amount: 900, status: 'ESCROW_HELD' },
      { allocation_type: 'RAW_SUPPLY', recipient_party_id: 'party-farmer-coop-lusaka', amount: 9900, status: 'ESCROW_HELD' },
      { allocation_type: 'PROCESSING_FEE', recipient_party_id: 'party-national-milling-ltd', amount: 2700, status: 'ESCROW_HELD' },
      { allocation_type: 'LOGISTICS_FEE', recipient_party_id: 'party-swift-trans-ltd', amount: 2700, status: 'ESCROW_HELD' },
      { allocation_type: 'DEPOT_COMMISSION', recipient_party_id: 'party-depot-operator-chilenje', amount: 1800, status: 'ESCROW_HELD' },
    ];
    dbMock.rpc.mockResolvedValueOnce(undefined);
    dbMock.select.mockResolvedValueOnce(mockSettlements);

    const allocations = await settlementService.processValueChainSettlement(
      'grp-mealie-001',
      'tx-pay-001',
      18000,
      'party-farmer-coop-lusaka',
      'party-national-milling-ltd',
      'party-swift-trans-ltd',
      'party-depot-operator-chilenje'
    );

    expect(allocations).toHaveLength(5);
    expect(allocations[0].allocation_type).toBe('PLATFORM_FEE');
    expect(allocations[1].allocation_type).toBe('RAW_SUPPLY');
    expect(allocations[2].allocation_type).toBe('PROCESSING_FEE');
  });
});
