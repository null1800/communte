'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, AlertCircle, Layers, Tag, Wheat, Factory } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

export default function SupplierDemandPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'offers' | 'raw' | 'milling'>('offers');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demandData, setDemandData] = useState<{
    offers: any[];
    totalDemandUnits: number;
    totalCommittedValue: number;
    activeGroupsCount: number;
  } | null>(null);

  const loadDemand = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getSupplierDemand();
      setDemandData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load demand details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemand();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-foreground">
          Supply Chain Demand & Processing Portal
        </h1>
        <p className="text-xs text-muted">
          Track customer demand clusters, raw material sourcing requirements, and milling batch jobs.
        </p>
      </div>

      {/* Role View Tabs */}
      <div className="flex border-b border-border text-xs font-bold gap-4">
        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-2 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === 'offers' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4" /> Finished Goods Offers
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`pb-2 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === 'raw' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Wheat className="w-4 h-4 text-success" /> Raw Commodity Sourcing (Farmers)
        </button>

        <button
          onClick={() => setActiveTab('milling')}
          className={`pb-2 transition-colors flex items-center gap-1.5 border-b-2 ${
            activeTab === 'milling' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Factory className="w-4 h-4 text-accent" /> Milling & Processing Contracts
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Calculating supply chain demand ledger...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      ) : activeTab === 'offers' ? (
        <div className="space-y-6">
          {!demandData || demandData.offers.length === 0 ? (
            <div className="cu-card p-10 text-center space-y-3">
              <Package className="w-8 h-8 text-muted mx-auto" />
              <p className="font-bold text-sm text-foreground">No active product offers found.</p>
              <p className="text-xs text-muted">Publish a product offer to begin receiving customer demand.</p>
              <Link href="/supplier/offers/create" className="inline-block pt-2">
                <Button variant="accent" size="sm">
                  Create Product Offer
                </Button>
              </Link>
            </div>
          ) : (
            demandData.offers.map((offer) => {
              const groupsForOffer = offer.groups || [];
              const committed = offer.total_committed_units || 0;
              const productTitle = offer.products?.name || offer.title || offer.unit_name;

              return (
                <div key={offer.id} className="cu-card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <h2 className="font-bold text-base text-foreground">{productTitle}</h2>
                      <p className="text-xs text-muted">
                        Unit: {offer.unit_name} · Price: ZMW {offer.unit_price}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="bg-primary-50 text-primary px-3 py-1 rounded-lg">
                        Stock Offered: {offer.available_quantity}
                      </div>
                      <div className="bg-success-50 text-success-700 px-3 py-1 rounded-lg">
                        Committed Demand: {committed}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                      Active Customer Buying Groups ({groupsForOffer.length})
                    </h3>

                    {groupsForOffer.length === 0 ? (
                      <p className="text-xs text-muted italic py-2">
                        No customer groups created for this offer yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
                        {groupsForOffer.map((group: any) => {
                          const groupCommitted = group.committed_quantity ?? group.funded_units ?? 0;
                          const groupTarget = group.target_quantity ?? group.target_units ?? 1;
                          const pct = Math.min(100, Math.round((groupCommitted / groupTarget) * 100));
                          return (
                            <div key={group.id} className="py-2.5 flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-xs text-foreground">{group.title}</p>
                                <p className="text-2xs text-muted">
                                  Collection Point: {group.collection_point}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 text-xs">
                                <div className="text-right">
                                  <span className="font-bold text-foreground">
                                    {groupCommitted} / {groupTarget} units
                                  </span>
                                  <span className="text-2xs text-muted block">({pct}% committed)</span>
                                </div>
                                <span
                                  className={`text-2xs px-2 py-0.5 rounded font-bold ${
                                    group.status === 'TARGET_REACHED' || group.status === 'ORDER_CREATED'
                                      ? 'bg-success-100 text-success-800'
                                      : 'bg-primary-50 text-primary'
                                  }`}
                                >
                                  {group.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'raw' ? (
        <div className="cu-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Raw Maize Grain Sourcing Opportunities</h3>
              <p className="text-2xs text-muted">Aggregate urban consumer demand requiring raw agricultural supply</p>
            </div>
            <span className="text-2xs font-bold text-success bg-success-50 px-2 py-0.5 rounded">
              Farmers & Cooperatives
            </span>
          </div>

          <div className="p-4 bg-primary-50/50 border border-primary-100 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Chilenje Hub — Raw Maize Requirement</span>
              <span className="text-2xs font-bold text-success-800 bg-white px-2 py-0.5 rounded border border-success-200">
                1.4 Metric Tons Required
              </span>
            </div>
            <p className="text-muted">
              Contracted Target Price: ZMW 110.00 / Ton equivalent • Payment Escrow Guaranteed
            </p>
            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="accent">
                Submit Farmer Supply Commitment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cu-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Local Milling & Processing Job Board</h3>
              <p className="text-2xs text-muted">Fee-for-service milling contracts for local millers</p>
            </div>
            <span className="text-2xs font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded">
              Millers & Processors
            </span>
          </div>

          <div className="p-4 bg-white border border-border rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Batch Job #402 — Mealie Meal Milling (100 Bags)</span>
              <span className="text-2xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">
                Milling Fee: ZMW 35.00 / Bag
              </span>
            </div>
            <p className="text-muted">
              Raw Grain Input: 1.4 Tons Yellow Maize • Yield Target: 100x 25kg Breakfast Bags
            </p>
            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary">
                Accept Milling Batch Contract
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
