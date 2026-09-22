'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ProductOffer, CollectionPoint } from '@communte/shared-types';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function CreateGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const offerId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<ProductOffer | null>(null);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [groupTitle, setGroupTitle] = useState('');
  const [targetUnits, setTargetUnits] = useState(20);
  const [initialContribution, setInitialContribution] = useState(2);
  const [selectedPointId, setSelectedPointId] = useState<string>('');
  const [customCollectionPoint, setCustomCollectionPoint] = useState('Chilenje Community Hall, Lusaka');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [resOffer, resPoints] = await Promise.all([
          apiClient.getProductOfferById(offerId),
          apiClient.getCollectionPoints().catch(() => []),
        ]);
        setOffer(resOffer.offer);
        setGroupTitle(`${resOffer.offer.title} Group · Lusaka`);
        setTargetUnits(resOffer.offer.default_target_units || 20);
        if (Array.isArray(resPoints) && resPoints.length > 0) {
          setCollectionPoints(resPoints);
          setSelectedPointId(resPoints[0].id);
          setCustomCollectionPoint(resPoints[0].name);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product offer.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [offerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push(`/auth?redirect=/product-offers/${offerId}/create-group`);
      return;
    }

    if (initialContribution <= 0 || targetUnits <= 0) {
      setError('Quantities must be greater than zero.');
      return;
    }

    if (initialContribution > targetUnits) {
      setError('Initial contribution cannot exceed group target units.');
      return;
    }

    setSubmitting(true);
    try {
      const closesAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const pointName =
        collectionPoints.find((cp) => cp.id === selectedPointId)?.name || customCollectionPoint;

      const createdGroup = await apiClient.createGroup({
        productOfferId: offerId,
        collectionPointId: selectedPointId || undefined,
        title: groupTitle,
        targetQuantity: Number(targetUnits),
        collectionPoint: pointName,
        closesAt,
        fulfillmentMode: 'MODEL_A_DIRECT',
      });

      if (createdGroup && createdGroup.id) {
        if (initialContribution > 0) {
          try {
            const key =
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `10000000-1000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
            await apiClient.commitToGroup(createdGroup.id, Number(initialContribution), key);
          } catch {
            // Ignore initial commit error if group created
          }
        }
        router.push(`/groups/${createdGroup.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create group.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground">Create Buying Group</h1>
          <p className="text-xs text-muted">Initiate a new group purchase for this product offer</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading offer specifications...</p>
        </div>
      ) : error && !offer ? (
        <div className="cu-card p-6 text-center text-danger">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : offer ? (
        <form onSubmit={handleSubmit} className="cu-card p-6 space-y-5">
          {/* Summary Box */}
          <div className="p-4 bg-primary-50/50 border border-primary-100 rounded-xl space-y-1">
            <p className="text-2xs font-bold text-primary uppercase tracking-wider">Product Offer</p>
            <p className="font-bold text-sm text-foreground">{offer.title}</p>
            <p className="text-xs text-muted">
              Unit: {offer.unit_name} · ZMW {offer.wholesale_price} per unit (Supplier MOQ: {offer.moq_units})
            </p>
          </div>

          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Title */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Group Title *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
            />
          </div>

          {/* Target Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Group Target Units *
              </label>
              <input
                type="number"
                required
                min={offer.moq_units}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                value={targetUnits}
                onChange={(e) => setTargetUnits(Number(e.target.value))}
              />
              <p className="text-2xs text-muted mt-1">Must be at least supplier MOQ ({offer.moq_units})</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Your Initial Contribution *
              </label>
              <input
                type="number"
                required
                min={1}
                max={targetUnits}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                value={initialContribution}
                onChange={(e) => setInitialContribution(Number(e.target.value))}
              />
              <p className="text-2xs text-muted mt-1">
                Cost: ZMW {(initialContribution * (offer.wholesale_price ?? offer.unit_price ?? 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Collection Point Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Collection Point Hub *
            </label>
            {collectionPoints.length > 0 ? (
              <select
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
                value={selectedPointId}
                onChange={(e) => setSelectedPointId(e.target.value)}
              >
                {collectionPoints.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} — {cp.address}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="e.g. Chilenje Community Hall, Matero Market Depot"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                value={customCollectionPoint}
                onChange={(e) => setCustomCollectionPoint(e.target.value)}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Create Group & Contribute
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
