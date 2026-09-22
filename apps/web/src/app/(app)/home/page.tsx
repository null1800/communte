'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, TrendingUp, Zap, Compass, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MobileTopBar } from '@/components/shell/MobileTopBar';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import { ProductOffer, Group } from '@communte/shared-types';

export default function HomePage() {
  const { user } = useAuth();
  const userId = user?.id || 'usr-customer-001';

  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const openSearch = () => {
    window.dispatchEvent(new Event('cu:open-search'));
  };

  const openDrawer = () => {
    window.dispatchEvent(new Event('cu:open-drawer'));
  };

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      try {
        const [offersRes, groupsRes] = await Promise.all([
          apiClient.getProductOffers().catch(() => []),
          apiClient.getGroups().catch(() => []),
        ]);
        setOffers(Array.isArray(offersRes) ? offersRes : []);
        setUserGroups(Array.isArray(groupsRes) ? groupsRes : []);
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <>
      <MobileTopBar
        showSearch
        onSearchOpen={openSearch}
        onMenuOpen={openDrawer}
        searchPlaceholder="Search product offers and groups…"
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Greeting Header */}
        <section>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {greeting}{user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted mt-1">
            Access wholesale product offers directly from Zambian suppliers.
          </p>

          <button
            onClick={openSearch}
            className="
              mt-4 w-full hidden lg:flex items-center gap-3
              h-11 px-4 rounded-xl
              bg-white border border-border text-muted text-sm text-left
              hover:border-primary-300 transition-colors
            "
          >
            <Search className="w-4 h-4 shrink-0" />
            Search product offers, categories, and buying groups…
          </button>
        </section>

        {/* Your Active Groups */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Your Active Groups</h2>
            <Link
              href="/groups"
              className="text-xs font-semibold text-primary hover:text-primary-800 flex items-center gap-0.5"
            >
              All groups <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-muted text-xs">Loading active groups...</div>
          ) : userGroups.length === 0 ? (
            <div className="cu-card p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">No active buying groups joined yet</p>
              <p className="text-xs text-muted">
                Join an open group on the marketplace or create a group for any product offer.
              </p>
              <Link href="/discover" className="inline-block pt-1">
                <Button size="sm" variant="accent">
                  Browse Offers
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userGroups.map((group) => {
                const committed = group.committed_quantity ?? group.funded_quantity ?? 0;
                const target = group.target_quantity ?? 1;
                const pct = Math.min(100, Math.round((committed / target) * 100));
                return (
                  <div key={group.id} className="cu-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-foreground">{group.title}</h3>
                      <span className="text-2xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary">
                        {group.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-2xs font-semibold text-muted">
                        <span>{committed} / {target} units</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <Link href={`/groups/${group.id}`} className="block pt-1">
                      <Button size="sm" fullWidth variant="secondary">
                        View Details
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Popular Supplier Product Offers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Wholesale Product Offers</h2>
              <p className="text-xs text-muted">Supplied directly by Zambian producers</p>
            </div>
            <Link
              href="/discover"
              className="text-xs font-semibold text-primary hover:text-primary-800 flex items-center gap-0.5"
            >
              Discover all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-muted text-xs">Loading marketplace offers...</div>
          ) : offers.length === 0 ? (
            <div className="cu-card p-8 text-center space-y-2">
              <Compass className="w-8 h-8 text-muted mx-auto" />
              <p className="font-bold text-sm text-foreground">No product offers available yet</p>
              <p className="text-xs text-muted">Check back soon for new wholesale listings from registered suppliers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.slice(0, 6).map((offer) => (
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
        </section>
      </div>
    </>
  );
}
