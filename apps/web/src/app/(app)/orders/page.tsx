'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Truck, ArrowRight, AlertCircle } from 'lucide-react';
import { MobileTopBar } from '@/components/shell/MobileTopBar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Order } from '@communte/shared-types';

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const userId = user?.id || 'usr-customer-001';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const openDrawer = () => window.dispatchEvent(new Event('cu:open-drawer'));

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getOrders();
      setOrders(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [userId]);

  return (
    <>
      <MobileTopBar title="My Orders" showBack={false} onMenuOpen={openDrawer} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-black tracking-tight">Orders & Fulfilment</h1>
          <p className="text-sm text-muted mt-1">
            Track commercial orders resulting from completed group funding.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading order ledger...</p>
          </div>
        ) : error ? (
          <div className="cu-card p-6 text-center text-danger">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 cu-card space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">No orders yet</h3>
            <p className="text-xs text-muted max-w-xs">
              Orders are generated automatically when a buying group reaches 100% target funding or meets supplier MOQ.
            </p>
            <Link href="/discover">
              <Button size="sm" variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Discover Buying Groups
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = (order.fulfilment as any)?.status || order.status || 'PENDING';
              const totalAmount = order.total_amount ?? order.total_price ?? 0;
              const collectionPoint = (order.fulfilment as any)?.collection_point || order.collection_point || 'Community Depot';

              return (
                <div key={order.id} className="cu-card p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">Order #{order.id}</h3>
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
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
                        Collection Point: {collectionPoint}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-sm text-foreground">ZMW {totalAmount.toLocaleString()}</p>
                      <p className="text-2xs text-muted">{order.quantity} total units</p>
                    </div>
                  </div>

                <div className="flex items-center justify-between text-2xs text-muted">
                  <span>Placed on: {new Date(order.created_at).toLocaleDateString()}</span>
                  {order.delivered_at ? (
                    <span className="text-success font-semibold">
                      Delivered: {new Date(order.delivered_at).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </>
  );
}
