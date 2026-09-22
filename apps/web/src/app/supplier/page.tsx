'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackagePlus, TrendingUp, Truck, Layers, ArrowRight, AlertCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ProductOffer, Group, Order } from '@communte/shared-types';
import { Button } from '@/components/ui/Button';

export default function SupplierDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    supplierId?: string;
    supplierName?: string;
    offers: any[];
    totalDemandUnits: number;
    totalCommittedValue: number;
    activeGroupsCount: number;
  } | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await apiClient.getSupplierDemand();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load supplier demand dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Supplier Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted">
            Manage your product offers, monitor customer group demand, and fulfil bulk orders.
          </p>
        </div>
        <Link href="/supplier/offers/create">
          <Button variant="accent" leftIcon={<PackagePlus className="w-4 h-4" />}>
            Create Product Offer
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading supplier demand analytics...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="cu-card p-4 space-y-1">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Active Offers</span>
                <Layers className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-black text-foreground">{data.offers.length}</p>
              <p className="text-2xs text-muted">Published product offers</p>
            </div>

            <div className="cu-card p-4 space-y-1">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Buying Groups</span>
                <PackagePlus className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">{data.activeGroupsCount}</p>
              <p className="text-2xs text-muted">Active buying groups</p>
            </div>

            <div className="cu-card p-4 space-y-1">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Committed Demand</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <p className="text-2xl font-black text-foreground">{data.totalDemandUnits}</p>
              <p className="text-2xs text-muted">Units in active customer groups</p>
            </div>

            <div className="cu-card p-4 space-y-1">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Committed Value</span>
                <Truck className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl font-black text-foreground">
                ZMW {data.totalCommittedValue.toLocaleString()}
              </p>
              <p className="text-2xs text-muted">Total demand value</p>
            </div>
          </div>

          {/* Active Product Offers Table / Cards */}
          <div className="cu-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-bold text-base">Your Product Offers</h2>
                <p className="text-xs text-muted">Offers generating demand on the marketplace</p>
              </div>
              <Link href="/supplier/offers/create" className="text-xs font-bold text-accent flex items-center gap-1">
                + New Offer
              </Link>
            </div>

            {data.offers.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm font-semibold text-foreground">No product offers published yet.</p>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Create your first wholesale product offer to start receiving collective customer group orders.
                </p>
                <Link href="/supplier/offers/create" className="inline-block">
                  <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Publish Product Offer
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.offers.map((offer: any) => {
                  const groupsForOffer = offer.groups || [];
                  const totalDemand = offer.total_committed_units || 0;
                  const productTitle = offer.products?.name || offer.title || offer.unit_name;

                  return (
                    <div key={offer.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground">{productTitle}</h3>
                          <span className="text-2xs px-2 py-0.5 rounded-full font-semibold bg-success-50 text-success-700 border border-success-200">
                            {offer.status || 'PUBLISHED'}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {offer.unit_name} · ZMW {offer.unit_price} wholesale (MOQ: {offer.minimum_order_quantity} units)
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <p className="font-bold text-foreground">{totalDemand} units committed</p>
                          <p className="text-2xs text-muted">{groupsForOffer.length} active groups</p>
                        </div>
                        <Link href="/supplier/demand">
                          <Button size="sm" variant="secondary">
                            View Demand
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
