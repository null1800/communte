'use client';

import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle2, PackageCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Order } from '@communte/shared-types';
import { Button } from '@/components/ui/Button';

export default function SupplierOrdersPage() {
  const { user } = useAuth();
  const supplierId = user?.supplierId || 'sup-default-001';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getOrders();
      setOrders(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load supplier orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: 'READY_FOR_COLLECTION' | 'DISPATCHED' | 'DELIVERED' = 'READY_FOR_COLLECTION';
    if (currentStatus === 'PENDING') nextStatus = 'READY_FOR_COLLECTION';
    else if (currentStatus === 'READY_FOR_COLLECTION') nextStatus = 'DISPATCHED';
    else if (currentStatus === 'DISPATCHED') nextStatus = 'DELIVERED';
    else return;

    setUpdatingId(orderId);
    try {
      await apiClient.updateFulfilmentStatus(orderId, nextStatus);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-foreground">Order Fulfilment Management</h1>
        <p className="text-xs text-muted">
          Manage, confirm, and update dispatch status for resulting group orders.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Fetching orders...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="cu-card p-12 text-center space-y-3">
          <Truck className="w-10 h-10 text-muted mx-auto" />
          <p className="font-bold text-sm text-foreground">No orders pending fulfilment.</p>
          <p className="text-xs text-muted">
            Commercial orders will automatically appear here as soon as customer buying groups reach their target funding.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = (order.fulfilment as any)?.status || order.status || 'PENDING';
            const totalAmount = order.total_amount ?? order.total_price ?? 0;
            const destination = (order.fulfilment as any)?.collection_point || order.collection_point || 'Community Hub';

            return (
              <div key={order.id} className="cu-card p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-foreground">Order #{order.id}</h2>
                      <span
                        className={`text-2xs font-bold px-2.5 py-0.5 rounded-full ${
                          status === 'DELIVERED'
                            ? 'bg-success-100 text-success-800'
                            : status === 'DISPATCHED'
                            ? 'bg-accent-50 text-accent-700'
                            : 'bg-primary-50 text-primary'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Group ID: {order.group_id} · Destination: {destination}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-sm text-foreground">ZMW {totalAmount.toLocaleString()}</p>
                    <p className="text-2xs text-muted">{order.quantity} total units</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-2xs text-muted space-y-0.5">
                    <p>Placed: {new Date(order.created_at).toLocaleString()}</p>
                    {order.confirmed_at && <p>Confirmed: {new Date(order.confirmed_at).toLocaleString()}</p>}
                    {order.dispatched_at && <p>Dispatched: {new Date(order.dispatched_at).toLocaleString()}</p>}
                    {order.delivered_at && <p>Delivered: {new Date(order.delivered_at).toLocaleString()}</p>}
                  </div>

                  {status !== 'DELIVERED' && (
                    <Button
                      size="sm"
                      variant="accent"
                      isLoading={updatingId === order.id}
                      onClick={() => advanceStatus(order.id, status)}
                    >
                      {status === 'PENDING'
                        ? 'Confirm Order'
                        : status === 'READY_FOR_COLLECTION' || status === 'CONFIRMED'
                        ? 'Mark as Dispatched'
                        : 'Mark as Delivered'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
