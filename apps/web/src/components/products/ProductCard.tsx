import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/mock-data';

type MockProduct = (typeof MOCK_PRODUCTS)[number];

interface ProductCardProps {
  product: MockProduct;
  /** Number of active groups for this product */
  activeGroups?: number;
  onJoin?: (productId: string) => void;
}

export function ProductCard({ product, activeGroups, onJoin }: ProductCardProps) {
  const savings = product.retail_price_ref - product.price_per_unit;

  return (
    <div className="cu-card cu-card-hover p-4 flex flex-col gap-3">
      {/* Savings badge */}
      <div className="flex items-start justify-between gap-2">
        <Badge variant="success" className="shrink-0">
          Save {product.savings_percentage}%
        </Badge>
        {(activeGroups ?? product.activeGroups) > 0 && (
          <span className="flex items-center gap-1 text-2xs text-muted">
            <Users className="w-3 h-3" />
            {activeGroups ?? product.activeGroups} active {(activeGroups ?? product.activeGroups) === 1 ? 'group' : 'groups'}
          </span>
        )}
      </div>

      {/* Product name */}
      <div>
        <h3 className="font-semibold text-sm text-foreground leading-snug">{product.name}</h3>
        <p className="text-xs text-muted mt-0.5">{product.unit_name}</p>
      </div>

      {/* Pricing */}
      <div className="space-y-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-foreground tabular-nums">
            {formatCurrency(product.price_per_unit)}
          </span>
          <span className="text-xs text-muted line-through tabular-nums">
            {formatCurrency(product.retail_price_ref)}
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-success font-medium">
          <TrendingDown className="w-3.5 h-3.5" />
          Save {formatCurrency(savings)} per unit
        </p>
      </div>

      {/* CTA */}
      <Link href={`/discover?product=${product.id}`} className="mt-auto">
        <Button
          size="sm"
          variant="primary"
          fullWidth
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={onJoin ? () => onJoin(product.id) : undefined}
        >
          Join a Group
        </Button>
      </Link>
    </div>
  );
}
