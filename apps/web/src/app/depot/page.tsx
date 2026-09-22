'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  Users,
  Search,
  ArrowRight,
} from 'lucide-react';
import { MobileTopBar } from '@/components/shell/MobileTopBar';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import { CollectionPoint } from '@communte/shared-types';

export default function DepotDashboardPage() {
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string>('');
  const [depotData, setDepotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim Verification State
  const [claimInput, setClaimInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const openDrawer = () => window.dispatchEvent(new Event('cu:open-drawer'));

  useEffect(() => {
    async function loadCollectionPoints() {
      setLoading(true);
      try {
        const res = await apiClient.getCollectionPoints().catch(() => []);
        if (Array.isArray(res) && res.length > 0) {
          setPoints(res);
          setSelectedPointId(res[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load collection points.');
      } finally {
        setLoading(false);
      }
    }
    loadCollectionPoints();
  }, []);

  useEffect(() => {
    if (!selectedPointId) return;
    async function fetchDepotDetails() {
      try {
        const res = await apiClient.getDepotAllocations(selectedPointId).catch(() => null);
        setDepotData(res);
      } catch (err: any) {
        // Fallback for mock view
      }
    }
    fetchDepotDetails();
  }, [selectedPointId]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifyResult(null);

    if (!claimInput.trim()) {
      setVerifyError('Please enter a claim code.');
      return;
    }

    setVerifying(true);
    try {
      const res = await apiClient.verifyClaimCode(claimInput.trim());
      setVerifyResult(res);
      setClaimInput('');
    } catch (err: any) {
      setVerifyError(err.message || 'Claim verification failed. Code may be invalid or already claimed.');
    } finally {
      setVerifying(false);
    }
  };

  const selectedPoint = points.find((p) => p.id === selectedPointId);

  return (
    <>
      <MobileTopBar title="Depot Operator Portal" showBack={false} onMenuOpen={openDrawer} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Collection Hub Handover Dashboard
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Verify customer pickup claim codes and manage neighborhood depot consignments.
            </p>
          </div>

          {/* Hub Selector */}
          {points.length > 0 && (
            <div className="flex items-center gap-2 bg-white p-2 border border-border rounded-xl">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <select
                className="text-xs font-bold text-foreground bg-transparent border-none focus:outline-none cursor-pointer"
                value={selectedPointId}
                onChange={(e) => setSelectedPointId(e.target.value)}
              >
                {points.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Claim Verification Box */}
        <section className="cu-card p-6 space-y-4 bg-gradient-to-br from-white to-primary-50/40 border-2 border-primary-100">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Customer Pickup Claim Verification</h3>
                <p className="text-2xs text-muted">Scan or type customer claim code for commodity handover</p>
              </div>
            </div>
            <span className="text-2xs font-bold text-success bg-success-50 px-2 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure Verification
            </span>
          </div>

          {verifyError && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}

          {verifyResult && (
            <div className="p-4 bg-success-50 border border-success-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-success-800 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" /> Handover Authorized
                </span>
                <span className="text-2xs font-semibold text-muted">
                  Verified: {new Date().toLocaleTimeString()}
                </span>
              </div>
              <p className="text-foreground">
                <span className="font-bold">Customer:</span> {verifyResult.customerName || 'Verified Member'}
              </p>
              <p className="text-foreground">
                <span className="font-bold">Item & Quantity:</span> {verifyResult.productTitle || 'Staple Allocation'} (
                {verifyResult.quantityUnits || 2} units)
              </p>
              <p className="text-2xs text-success-700 italic mt-1">
                {verifyResult.message || 'Status updated to CLAIMED. Handover completed.'}
              </p>
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Enter Claim Code (e.g. CLAIM-MEALIE-001)"
                className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold border border-border rounded-xl focus:outline-none focus:border-primary uppercase tracking-wide"
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="accent"
              isLoading={verifying}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify Handover
            </Button>
          </form>
        </section>

        {/* Selected Hub Summary & Active Groups */}
        {selectedPoint && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="cu-card p-4 space-y-1">
              <p className="text-2xs text-muted font-bold uppercase">Hub Address</p>
              <p className="text-xs font-bold text-foreground">{selectedPoint.address}</p>
            </div>
            <div className="cu-card p-4 space-y-1">
              <p className="text-2xs text-muted font-bold uppercase">Depot Capacity</p>
              <p className="text-xs font-bold text-foreground">{selectedPoint.capacity_units} Units</p>
            </div>
            <div className="cu-card p-4 space-y-1">
              <p className="text-2xs text-muted font-bold uppercase">Status</p>
              <p className="text-xs font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Operational
              </p>
            </div>
          </section>
        )}

        {/* Consignment Audit Ledger */}
        <section className="cu-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Depot Consignments & Handover Ledger</h3>
            </div>
            <span className="text-2xs text-muted">Real-time hub ledger</span>
          </div>

          {!depotData || !depotData.groups || depotData.groups.length === 0 ? (
            <div className="p-6 text-center text-muted text-xs space-y-1">
              <p className="font-semibold text-foreground">Active Hub: {selectedPoint?.name || 'Central Depot'}</p>
              <p>No uncollected consignments currently at this depot hub.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {depotData.groups.map((g: any) => (
                <div key={g.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-foreground">{g.title}</p>
                    <p className="text-2xs text-muted">
                      Target: {g.target_quantity} units • Committed: {g.committed_quantity} units
                    </p>
                  </div>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary uppercase">
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
