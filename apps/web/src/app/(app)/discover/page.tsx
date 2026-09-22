'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, Layers, MapPin, Tag } from 'lucide-react';
import { MobileTopBar } from '@/components/shell/MobileTopBar';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import { ProductOffer, Product, CollectionPoint } from '@communte/shared-types';
import { CATEGORIES } from '@/lib/mock-data';

export default function DiscoverPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const openSearch = () => window.dispatchEvent(new Event('cu:open-search'));
  const openDrawer = () => window.dispatchEvent(new Event('cu:open-drawer'));

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resOffers, resProducts, resPoints] = await Promise.all([
        apiClient.getProductOffers().catch(() => []),
        apiClient.getCatalogProducts(activeCategory || undefined).catch(() => []),
        apiClient.getCollectionPoints().catch(() => []),
      ]);
      setOffers(Array.isArray(resOffers) ? resOffers : []);
      setCatalogProducts(Array.isArray(resProducts) ? resProducts : []);
      setCollectionPoints(Array.isArray(resPoints) ? resPoints : []);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCategory]);

  return (
    <>
      <MobileTopBar
        title="Discover"
        showBack={false}
        showSearch
        onSearchOpen={openSearch}
        onMenuOpen={openDrawer}
        searchPlaceholder="Search product offers…"
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Wholesale & Staple Marketplace</h1>
            <p className="text-sm text-muted mt-1">
              Browse wholesale offers and staple agricultural products available for neighborhood group buying.
            </p>
          </div>
        </div>

        {/* Collection Points Banner */}
        {collectionPoints.length > 0 && (
          <section className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Active Neighborhood Collection Hubs</h3>
                <p className="text-2xs text-muted">
                  {collectionPoints.map((cp) => cp.name).join(' • ')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary bg-white px-3 py-1 rounded-full border border-primary-200">
              {collectionPoints.length} Hubs Active
            </span>
          </section>
        )}

        {/* Category Filter Chips */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={[
                'shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors border',
                activeCategory === null
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-foreground border-border hover:border-primary-300',
              ].join(' ')}
            >
              All
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory((prev) => (prev === cat.id ? null : cat.id))}
                className={[
                  'shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors border whitespace-nowrap',
                  activeCategory === cat.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-foreground border-border hover:border-primary-300',
                ].join(' ')}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Product Offers & Catalog Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Marketplace Items</h2>
            {!loading && (
              <span className="text-xs text-muted">
                {offers.length + catalogProducts.length} items listed
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Fetching marketplace items...</p>
            </div>
          ) : error ? (
            <div className="cu-card p-6 text-center text-danger space-y-2">
              <p className="text-sm font-semibold">{error}</p>
              <Button size="sm" variant="secondary" onClick={fetchData}>
                Retry
              </Button>
            </div>
          ) : offers.length === 0 && catalogProducts.length === 0 ? (
            <div className="cu-card p-10 text-center space-y-3">
              <Compass className="w-10 h-10 text-muted mx-auto" />
              <h3 className="font-bold text-base text-foreground">No marketplace items available</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                No active offers or catalog items found in this category. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Render Model A Supplier Offers */}
              {offers.map((offer) => (
                <div key={offer.id} className="cu-card p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">
                        {offer.category}
                      </span>
                      <span className="text-2xs font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Model A: Direct Offer
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground leading-snug">{offer.title}</h3>
                    <p className="text-xs text-muted">{offer.unit_name}</p>

                    <div className="pt-2 border-t border-border flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-black text-foreground">
                          ZMW {offer.wholesale_price}
                        </span>
                        <span className="text-2xs text-muted ml-1 line-through">
                          ZMW {offer.retail_price_ref}
                        </span>
                      </div>
                      <span className="text-2xs font-bold text-success bg-success-50 px-2 py-0.5 rounded">
                        {offer.savings_percentage}% OFF
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <div className="text-2xs text-muted flex justify-between">
                      <span>Available: {offer.available_quantity - (offer.reserved_quantity ?? 0)}</span>
                      <span>MOQ: {offer.minimum_order_quantity}</span>
                    </div>

                    <Link href={`/product-offers/${offer.id}`} className="block">
                      <Button size="sm" fullWidth rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        View Offer & Groups
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {/* Render Model B Agricultural Staples Catalog */}
              {catalogProducts.map((prod) => {
                const savings = prod.retail_price_ref
                  ? Math.round(((prod.retail_price_ref - prod.price_per_unit) / prod.retail_price_ref) * 100)
                  : 45;
                return (
                  <div key={prod.id} className="cu-card p-4 space-y-3 flex flex-col justify-between border-2 border-primary-100">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-2xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">
                          {prod.category}
                        </span>
                        <span className="text-2xs font-bold text-success-800 bg-success-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Model B: Sourced & Milled
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-foreground leading-snug">{prod.name}</h3>
                      <p className="text-xs text-muted">{prod.unit_name} • Direct Farm Sourcing</p>

                      <div className="pt-2 border-t border-border flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-black text-foreground">
                            ZMW {prod.price_per_unit}
                          </span>
                          {prod.retail_price_ref && (
                            <span className="text-2xs text-muted ml-1 line-through">
                              ZMW {prod.retail_price_ref}
                            </span>
                          )}
                        </div>
                        <span className="text-2xs font-bold text-success bg-success-50 px-2 py-0.5 rounded">
                          {savings}% OFF RETAIL
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 space-y-2">
                      <div className="text-2xs text-muted flex justify-between">
                        <span>Direct Sourcing & Local Milling</span>
                        <span>Staple Guarantee</span>
                      </div>

                      <Link href={`/groups`} className="block">
                        <Button size="sm" variant="accent" fullWidth rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Join Demand Group
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
