'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, TrendingDown, ShieldCheck, MapPin, Compass } from 'lucide-react';
import { PublicTopBar } from '@/components/shell/TopBar';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ProductOffer } from '@communte/shared-types';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Discover a product offer',
    body: 'Browse verified supplier wholesale offers — from mealie meal to cooking oil.',
    icon: '🔍',
  },
  {
    step: '02',
    title: 'Join or create a group',
    body: 'Add your requested quantity to a community buying group for that offer.',
    icon: '🤝',
  },
  {
    step: '03',
    title: 'Group reaches target',
    body: 'Once enough members join, the bulk order is placed directly with the supplier.',
    icon: '🎯',
  },
  {
    step: '04',
    title: 'Collect and save',
    body: 'Pick up at your nearest collection point and watch your household savings grow.',
    icon: '📦',
  },
];

export default function PublicHome() {
  const { isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      setLoading(true);
      try {
        const res = await apiClient.getProductOffers();
        setOffers(Array.isArray(res) ? res : []);
      } catch {
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, []);

  return (
    <>
      <PublicTopBar onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="hidden lg:block h-[3.5rem]" />

      {/* Hero */}
      <section className="bg-primary px-4 pt-16 pb-20 lg:pt-24 lg:pb-28 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5" />
            Zambian households saving together on wholesale essentials
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-balance">
            Wholesale prices for every Zambian household
          </h1>

          <p className="text-primary-200 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            ComUnite combines your household's demand with your neighbours' so you access the same bulk prices that supermarkets pay — directly from suppliers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {isAuthenticated ? (
              <Link href="/home">
                <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open ComUnite
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Join ComUnite — It's Free
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button
                    size="lg"
                    className="bg-white/10 border border-white/30 text-white hover:bg-white/20"
                  >
                    How It Works
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Product Offers Section */}
      <section className="bg-background px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight">Supplier Product Offers</h2>
              <p className="text-sm text-muted mt-0.5">Wholesale supply available for group purchasing</p>
            </div>
            <Link href="/discover" className="text-sm font-semibold text-primary flex items-center gap-1">
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted text-xs">Loading marketplace offers...</div>
          ) : offers.length === 0 ? (
            <div className="cu-card p-10 text-center space-y-2">
              <Compass className="w-8 h-8 text-muted mx-auto" />
              <p className="font-bold text-sm text-foreground">No product offers available yet</p>
              <p className="text-xs text-muted">
                Suppliers have not published any product offers yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.slice(0, 3).map((offer) => (
                <div key={offer.id} className="cu-card p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded">
                        {offer.category}
                      </span>
                      <span className="text-2xs text-muted">{offer.supplier_name}</span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground">{offer.title}</h3>
                    <p className="text-xs text-muted">{offer.unit_name}</p>

                    <div className="flex items-baseline justify-between pt-2 border-t border-border">
                      <span className="text-base font-black text-foreground">
                        ZMW {offer.wholesale_price}
                      </span>
                      <span className="text-2xs font-bold text-success bg-success-50 px-2 py-0.5 rounded">
                        Save {offer.savings_percentage}%
                      </span>
                    </div>
                  </div>

                  <Link href={`/product-offers/${offer.id}`} className="block pt-2">
                    <Button size="sm" fullWidth rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Offer & Groups
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white px-4 py-14 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black tracking-tight">How ComUnite works</h2>
            <p className="text-sm text-muted mt-2">Four simple steps to your first wholesale delivery</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center space-y-3">
                <div className="text-3xl">{item.icon}</div>
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary text-sm font-black flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-background px-4 py-10 border-t border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <ShieldCheck className="w-6 h-6 text-primary mx-auto" />
            <p className="font-bold text-sm">Verified Suppliers</p>
            <p className="text-xs text-muted">All suppliers are vetted before listing on ComUnite</p>
          </div>
          <div className="space-y-1">
            <TrendingDown className="w-6 h-6 text-success mx-auto" />
            <p className="font-bold text-sm">Direct Wholesale Prices</p>
            <p className="text-xs text-muted">Avoid middleman retail markups</p>
          </div>
          <div className="space-y-1">
            <MapPin className="w-6 h-6 text-accent mx-auto" />
            <p className="font-bold text-sm">Local Collection Points</p>
            <p className="text-xs text-muted">Collect at a community hub near you in Lusaka</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-black text-2xs">CU</span>
            </div>
            <span className="font-semibold text-foreground">ComUnite</span>
            <span>· Group Purchasing Platform</span>
          </div>
        </div>
      </footer>
    </>
  );
}
