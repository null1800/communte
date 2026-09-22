'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  PlusCircle,
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ProductOffer, Group } from '@communte/shared-types';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function ProductOfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const offerId = resolvedParams.id;
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<ProductOffer | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getProductOfferById(offerId);
      setOffer(res.offer);
      setGroups(res.groups || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load product offer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [offerId]);

  const handleCreateGroup = () => {
    if (!isAuthenticated) {
      // Redirect to auth preserving target action context
      router.push(`/auth?redirect=/product-offers/${offerId}/create-group`);
      return;
    }
    router.push(`/product-offers/${offerId}/create-group`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground">Product Offer Details</h1>
          <p className="text-xs text-muted">View wholesale supply terms and active buying groups</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading product offer details...</p>
        </div>
      ) : error ? (
        <div className="cu-card p-8 text-center text-danger space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="font-semibold text-sm">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => router.push('/discover')}>
            Back to Marketplace
          </Button>
        </div>
      ) : offer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="cu-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-1 rounded">
                  {offer.category}
                </span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Verified Supplier: {offer.supplier_name}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">{offer.title}</h2>
                <p className="text-xs text-muted mt-1">{offer.unit_name}</p>
              </div>

              {offer.description && (
                <p className="text-xs text-muted leading-relaxed border-t border-border pt-3">
                  {offer.description}
                </p>
              )}

              {/* Pricing Box */}
              <div className="p-4 bg-gray-50 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-2xs text-muted uppercase font-bold tracking-wider">Wholesale Price</p>
                  <p className="text-2xl font-black text-foreground">ZMW {offer.wholesale_price}</p>
                  <p className="text-2xs text-muted">
                    Retail Reference: <span className="line-through">ZMW {offer.retail_price_ref}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-success bg-success-50 border border-success-200 px-3 py-1 rounded-full">
                    Save {offer.savings_percentage}%
                  </span>
                </div>
              </div>

              {/* Offer Terms */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3 bg-white border border-border rounded-lg">
                  <p className="text-2xs text-muted font-semibold">Available Stock</p>
                  <p className="font-bold text-foreground">{offer.available_quantity - (offer.reserved_quantity ?? offer.allocated_quantity ?? 0)} units</p>
                </div>
                <div className="p-3 bg-white border border-border rounded-lg">
                  <p className="text-2xs text-muted font-semibold">Supplier MOQ</p>
                  <p className="font-bold text-foreground">{offer.minimum_order_quantity ?? offer.moq_units ?? 1} units</p>
                </div>
                <div className="p-3 bg-white border border-border rounded-lg col-span-2 sm:col-span-1">
                  <p className="text-2xs text-muted font-semibold">Default Target</p>
                  <p className="font-bold text-foreground">{offer.default_target_units ?? offer.minimum_order_quantity ?? 10} units</p>
                </div>
              </div>

              {((offer as any).fulfilment_info || (offer as any).delivery_terms) && (
                <div className="flex items-start gap-2 text-2xs text-muted bg-primary-50/50 p-3 rounded-lg border border-primary-100">
                  <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{(offer as any).fulfilment_info || (offer as any).delivery_terms}</span>
                </div>
              )}
            </div>

            {/* Existing Buying Groups for this Offer (Multiple Groups per Offer!) */}
            <div className="cu-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-base text-foreground">Active Buying Groups</h3>
                  <p className="text-xs text-muted">
                    Join an existing group or start a new group for this offer.
                  </p>
                </div>
                <Button size="sm" variant="accent" onClick={handleCreateGroup} leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create New Group
                </Button>
              </div>

              {groups.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <Users className="w-8 h-8 text-muted mx-auto" />
                  <p className="font-bold text-sm text-foreground">No active groups yet for this offer.</p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Be the first customer to create a buying group for "{offer.title}".
                  </p>
                  <Button size="sm" variant="accent" onClick={handleCreateGroup} leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Create First Group
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {groups.map((group) => {
                    const committed = group.committed_quantity ?? group.funded_quantity ?? 0;
                    const target = group.target_quantity ?? 1;
                    const pct = Math.min(100, Math.round((committed / target) * 100));
                    return (
                      <div key={group.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground">{group.title}</h4>
                            <span className="text-2xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary">
                              {group.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted">Collection: {group.collection_point}</p>
                          <div className="w-48 bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                            <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs">
                            <p className="font-bold text-foreground">
                              {committed} / {target} units
                            </p>
                            <p className="text-2xs text-muted">{pct}% committed</p>
                          </div>
                          <Link href={`/groups/${group.id}`}>
                            <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                              View & Join
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Action Card */}
          <div className="space-y-4">
            <div className="cu-card p-5 space-y-4 sticky top-20">
              <h3 className="font-bold text-sm text-foreground">Group Purchasing Actions</h3>
              <p className="text-xs text-muted">
                Order directly from verified wholesale supply by forming a community group.
              </p>

              <div className="space-y-2 pt-2">
                <Button fullWidth variant="accent" size="lg" onClick={handleCreateGroup} leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create New Group
                </Button>
                {groups.length > 0 && (
                  <Link href={`/groups/${groups[0].id}`} className="block">
                    <Button fullWidth variant="secondary" size="lg">
                      Join Active Group
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
