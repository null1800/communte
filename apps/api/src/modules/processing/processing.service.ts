import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CreateProcessingOrderInput {
  demandGroupId: string;
  processorPartyId: string;
  transformationSpecId: string;
  inputQuantity: number;
  outputQuantity: number;
  millingFee: number;
}

@Injectable()
export class ProcessingService {
  constructor(private readonly db: DatabaseService) {}

  async createOrderAndBatch(input: CreateProcessingOrderInput) {
    return this.db.rpc('create_processing_order_and_batch_rpc', {
      p_demand_group_id: input.demandGroupId,
      p_processor_party_id: input.processorPartyId,
      p_transformation_spec_id: input.transformationSpecId,
      p_input_quantity: input.inputQuantity,
      p_output_quantity: input.outputQuantity,
      p_milling_fee: input.millingFee,
    });
  }

  async listForGroup(demandGroupId: string) {
    const orders = await this.db.select<Record<string, unknown>>(
      'processing_orders',
      `demand_group_id=eq.${encodeURIComponent(demandGroupId)}&select=*`
    );
    const orderIds = orders.map(o => o.id);
    let batches: Record<string, unknown>[] = [];
    if (orderIds.length > 0) {
      batches = await this.db.select<Record<string, unknown>>(
        'processing_batches',
        `processing_order_id=in.(${orderIds.map(id => `"${id}"`).join(',')})&select=*`
      );
    }
    return { orders, batches };
  }

  async updateBatchStatus(batchId: string, demandGroupId: string, status: 'QA_PASSED' | 'QA_FAILED', qaNotes?: string) {
    const updated = await this.db.update<Record<string, unknown>>(
      'processing_batches',
      `id=eq.${encodeURIComponent(batchId)}`,
      { status, qa_notes: qaNotes || null, updated_at: new Date().toISOString() }
    );
    if (status === 'QA_FAILED') {
      await this.db.rpc('mark_group_failed_rpc', {
        p_group_id: demandGroupId,
        p_reason: qaNotes || 'Processing batch failed QA verification',
      });
    }
    return updated[0];
  }

  async markGroupFailed(demandGroupId: string, reason: string) {
    return this.db.rpc('mark_group_failed_rpc', {
      p_group_id: demandGroupId,
      p_reason: reason,
    });
  }
}
