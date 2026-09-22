'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/mock-data';
import { apiClient } from '@/lib/api-client';
import { ProductOffer } from '@communte/shared-types';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface ResultGroup {
  label: string;
  items: { id: string; title: string; subtitle: string; href: string }[];
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultGroup[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    let isCancelled = false;
    async function searchOffers() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const q = query.toLowerCase();

      try {
        const offers = await apiClient.getProductOffers();
        if (isCancelled) return;

        const matchedOffers = (Array.isArray(offers) ? offers : [])
          .filter(
            (o) =>
              (o.title || '').toLowerCase().includes(q) ||
              (o.unit_name || '').toLowerCase().includes(q) ||
              (o.fulfilment_terms || '').toLowerCase().includes(q),
          )
          .slice(0, 4)
          .map((o) => ({
            id: o.id,
            title: o.title || o.unit_name,
            subtitle: `Wholesale Offer · ${o.unit_name} · ZMW ${o.unit_price}`,
            href: `/product-offers/${o.id}`,
          }));

        const matchedCategories = CATEGORIES.filter((c) => c.label.toLowerCase().includes(q))
          .slice(0, 2)
          .map((c) => ({
            id: c.id,
            title: c.label,
            subtitle: 'Browse marketplace category',
            href: `/discover`,
          }));

        const list: ResultGroup[] = [];
        if (matchedOffers.length) list.push({ label: 'Product Offers', items: matchedOffers });
        if (matchedCategories.length) list.push({ label: 'Categories', items: matchedCategories });
        setResults(list);
      } catch {
        if (!isCancelled) setResults([]);
      }
    }

    searchOffers();
    return () => {
      isCancelled = true;
    };
  }, [query]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onClose]);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) onClose(); // will be called to open by parent
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  const handleItemClick = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        w-full max-w-xl
        bg-white rounded-2xl shadow-2xl border border-border
        overflow-hidden animate-fade-in
        mx-4
      ">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Search className="w-5 h-5 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, groups and categories…"
            className="flex-1 text-base text-foreground placeholder:text-muted bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-background"
            >
              <X className="w-4 h-4 text-muted" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-muted border border-border rounded px-2 py-1 hover:bg-background hidden sm:block"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && query === '' && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Start typing to search…
            </div>
          )}

          {results.length === 0 && query !== '' && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              No results for <span className="font-semibold text-foreground">"{query}"</span>
            </div>
          )}

          {results.map(group => (
            <div key={group.label}>
              <p className="cu-section-label px-4 pt-4 pb-2">{group.label}</p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted shrink-0" />
                </button>
              ))}
            </div>
          ))}

          {results.length > 0 && (
            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={() => handleItemClick(`/discover?q=${encodeURIComponent(query)}`)}
                className="text-sm font-medium text-primary hover:text-primary-800 flex items-center gap-1"
              >
                See all results for "{query}"
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
