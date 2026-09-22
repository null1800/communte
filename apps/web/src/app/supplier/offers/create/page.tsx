'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackagePlus, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  'Grains & Flour',
  'Cooking & Oils',
  'Sugar & Sweeteners',
  'Cleaning & Hygiene',
  'Spices & Seasonings',
  'Dairy & Eggs',
  'Pulses & Legumes',
  'Beverages',
];

function CreateOfferPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supplierId = user?.supplierId || 'sup-default-001';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Grains & Flour',
    unit_name: '25kg bag',
    available_quantity: 100,
    wholesale_price: 180,
    retail_price_ref: 380,
    moq_units: 10,
    default_target_units: 20,
    image_url: '',
    fulfilment_info: 'Direct warehouse dispatch upon group funding.',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.wholesale_price || !formData.available_quantity) {
      setError('Please fill in all required fields (Title, Wholesale Price, Available Quantity).');
      return;
    }

    setSubmitting(true);
    try {
      const products = await apiClient.getProducts();
      const productId = products[0]?.id || '11111111-1111-1111-1111-111111111111';

      await apiClient.createProductOffer({
        productId,
        unitName: formData.unit_name,
        availableQuantity: Number(formData.available_quantity),
        minimumOrderQuantity: Number(formData.moq_units),
        unitPrice: Number(formData.wholesale_price),
        fulfilmentTerms: formData.fulfilment_info,
      });

      router.push('/supplier');
    } catch (err: any) {
      setError(err.message || 'Failed to create product offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground">Create Product Offer</h1>
          <p className="text-xs text-muted">
            Publish a wholesale product offer for customer group purchasing.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="cu-card p-6 space-y-5">
        {/* Product Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold border-b border-border pb-2 text-foreground">Product Information</h2>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Offer / Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Premium White Mealie Meal (Breakfast)"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent bg-white"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Unit Packaging Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. 25kg bag, 20L container"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                value={formData.unit_name}
                onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Product Description</label>
            <textarea
              rows={3}
              placeholder="Provide product specification, brand info, and quality notes..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Pricing & Quantity */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold border-b border-border pb-2 text-foreground">
            Supply Quantity & Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Wholesale Price (ZMW) *
              </label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                value={formData.wholesale_price}
                onChange={(e) => setFormData({ ...formData, wholesale_price: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Retail Ref Price (ZMW) *
              </label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                value={formData.retail_price_ref}
                onChange={(e) => setFormData({ ...formData, retail_price_ref: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Total Available Stock *
              </label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                value={formData.available_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, available_quantity: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {/* Group / Bulk Conditions */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold border-b border-border pb-2 text-foreground">
            Bulk Order Conditions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Minimum Order Quantity (MOQ) *
              </label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                value={formData.moq_units}
                onChange={(e) => setFormData({ ...formData, moq_units: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Recommended Group Target *
              </label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                value={formData.default_target_units}
                onChange={(e) =>
                  setFormData({ ...formData, default_target_units: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Fulfilment & Delivery Information
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
              value={formData.fulfilment_info}
              onChange={(e) => setFormData({ ...formData, fulfilment_info: e.target.value })}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            isLoading={submitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Publish Offer to Marketplace
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateOfferPage;
