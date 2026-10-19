'use client';

import React, { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import {
  GlobalPresets,
  MenuItem,
  WorkspaceChannel,
  CalculationResult,
} from '@/types/pricing';
import {
  calculateMenuItem,
  calculateRecommendedPrice,
} from '@/lib/pricing-engine';
import {
  loadMenuItems,
  saveMenuItems,
  loadPresets,
  savePresets,
  getStoredActiveChannel,
  setStoredActiveChannel,
  resetWorkspaceToDefaults,
} from '@/lib/storage';
import { exportPricingToCsv } from '@/lib/csv-helper';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { KpiSummaryCards } from '@/components/KpiSummaryCards';
import { GlobalPresetBar } from '@/components/GlobalPresetBar';
import { PricingTable } from '@/components/PricingTable';
import { GrabReceiptModal } from '@/components/GrabReceiptModal';
import { AddMenuModal } from '@/components/AddMenuModal';
import {
  UtensilsCrossed,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const subscribeNoop = () => () => {};

export default function PricingEnginePage() {
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const [channel, setChannel] = useState<WorkspaceChannel>(getStoredActiveChannel);
  const [items, setItems] = useState<MenuItem[]>(() => loadMenuItems(getStoredActiveChannel()));
  const [presets, setPresets] = useState<GlobalPresets>(() => loadPresets(getStoredActiveChannel()));

  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync state
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<
    'idle' | 'success' | 'fallback' | 'error'
  >('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Handle Channel Change
  const handleChannelChange = (newChannel: WorkspaceChannel) => {
    setChannel(newChannel);
    setStoredActiveChannel(newChannel);
    const loadedItems = loadMenuItems(newChannel);
    const loadedPresets = loadPresets(newChannel);
    setItems(loadedItems);
    setPresets(loadedPresets);
    showToast(`Beralih ke workspace ${newChannel === 'GRABFOOD' ? 'GrabFood' : 'GoFood'}`);
  };

  // Synchronize item updates
  const handleUpdateItem = useCallback(
    (id: string, updates: Partial<MenuItem>) => {
      setItems((prev) => {
        const next = prev.map((it) =>
          it.id === id ? { ...it, ...updates, updatedAt: new Date().toISOString() } : it
        );
        saveMenuItems(channel, next);
        return next;
      });
    },
    [channel]
  );

  // Delete item
  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        saveMenuItems(channel, next);
        return next;
      });
      showToast('Menu berhasil dihapus');
    },
    [channel, showToast]
  );

  // Duplicate item
  const handleDuplicateItem = useCallback(
    (item: MenuItem) => {
      const duplicated: MenuItem = {
        ...item,
        id: `${channel.toLowerCase()}-${Date.now()}`,
        name: `${item.name} (Salinan)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems((prev) => {
        const next = [duplicated, ...prev];
        saveMenuItems(channel, next);
        return next;
      });
      showToast(`Menu "${duplicated.name}" berhasil diduplikasi`);
    },
    [channel, showToast]
  );

  // Add new item
  const handleAddMenuItem = useCallback(
    (newItem: MenuItem) => {
      setItems((prev) => {
        const next = [newItem, ...prev];
        saveMenuItems(channel, next);
        return next;
      });
      showToast(`Menu "${newItem.name}" berhasil ditambahkan`);
    },
    [channel, showToast]
  );

  // Update Presets
  const handlePresetsChange = useCallback(
    (newPresets: GlobalPresets) => {
      setPresets(newPresets);
      savePresets(channel, newPresets);
    },
    [channel]
  );

  // Apply Presets to All Items
  const handleApplyPresetsToAllItems = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((item) => ({
        ...item,
        platformCommissionPct: presets.platformCommissionPct,
        marketingBoosterPct: presets.marketingBoosterPct,
        merchantDiscountValue: presets.merchantDiscountValue,
        merchantDiscountType: presets.merchantDiscountType,
        isBoosterActive: presets.isBoosterActiveDefault,
        updatedAt: new Date().toISOString(),
      }));
      saveMenuItems(channel, next);
      return next;
    });
    showToast('Parameter preset global berhasil diterapkan ke semua menu');
  }, [channel, presets, showToast]);

  // Apply Ideal Price to Single Item
  const handleApplyIdealPrice = useCallback(
    (id: string, newPrice: number) => {
      handleUpdateItem(id, { displayPrice: newPrice });
      showToast(`Harga ideal ${newPrice.toLocaleString('id-ID')} berhasil diterapkan`);
    },
    [handleUpdateItem, showToast]
  );

  // Apply Ideal Price to ALL items
  const handleApplyAllIdealPrices = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((item) => {
        const rec = calculateRecommendedPrice(
          item.targetOfflinePrice,
          item.merchantDiscountType,
          item.merchantDiscountValue,
          item.platformCommissionPct,
          item.marketingBoosterPct,
          item.isBoosterActive,
          presets.roundingRule
        );
        return {
          ...item,
          displayPrice: rec.roundedRecommendedPrice,
          updatedAt: new Date().toISOString(),
        };
      });
      saveMenuItems(channel, next);
      return next;
    });
    showToast('Semua menu kini menggunakan Harga Ideal (Dijamin bebas boncos)!');
  }, [channel, presets.roundingRule, showToast]);

  // Reset Defaults
  const handleResetDefaults = useCallback(() => {
    const res = resetWorkspaceToDefaults(channel);
    setItems(res.items);
    setPresets(res.presets);
    showToast('Workspace berhasil di-reset ke nilai default awal.');
  }, [channel, showToast]);

  // Open Receipt Modal
  const handleOpenReceiptModal = useCallback((item?: MenuItem) => {
    setSelectedReceiptItem(item ?? null);
    setIsReceiptModalOpen(true);
  }, []);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const calcMap = new Map<string, CalculationResult>();
    items.forEach((item) => {
      calcMap.set(
        item.id,
        calculateMenuItem({
          targetOfflinePrice: item.targetOfflinePrice,
          displayPrice: item.displayPrice,
          merchantDiscountType: item.merchantDiscountType,
          merchantDiscountValue: item.merchantDiscountValue,
          platformCommissionPct: item.platformCommissionPct,
          marketingBoosterPct: item.marketingBoosterPct,
          isBoosterActive: item.isBoosterActive,
          roundingRule: presets.roundingRule,
        })
      );
    });
    exportPricingToCsv(items, calcMap, channel);
    showToast('File CSV berhasil diunduh');
  }, [items, channel, presets.roundingRule, showToast]);

  // Sync to PostgreSQL DB (with fallback to client storage)
  const handleSyncDatabase = async () => {
    setIsSyncingDb(true);
    setDbSyncStatus('idle');

    try {
      const response = await fetch('/api/pricings/bulk-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          presets: {
            platformCommissionPct: presets.platformCommissionPct,
            marketingBoosterPct: presets.marketingBoosterPct,
            merchantDiscountValue: presets.merchantDiscountValue,
            roundingRule: presets.roundingRule,
          },
          items,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.source === 'postgres') {
          setDbSyncStatus('success');
          showToast(`Berhasil tersimpan di PostgreSQL (${data.savedCount} menu)`);
        } else {
          setDbSyncStatus('fallback');
          showToast('Data tersimpan di penyimpanan lokal browser');
        }
      } else {
        setDbSyncStatus('error');
        showToast(`Gagal sinkronisasi: ${data.error || 'Server error'}`);
      }
    } catch {
      setDbSyncStatus('fallback');
      showToast('Mode offline aktif: data tersimpan aman di browser');
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Precompute calculations map for all items
  const calculations = useMemo(() => {
    const map = new Map<string, CalculationResult>();
    items.forEach((item) => {
      const calc = calculateMenuItem({
        targetOfflinePrice: item.targetOfflinePrice,
        displayPrice: item.displayPrice,
        merchantDiscountType: item.merchantDiscountType,
        merchantDiscountValue: item.merchantDiscountValue,
        platformCommissionPct: item.platformCommissionPct,
        marketingBoosterPct: item.marketingBoosterPct,
        isBoosterActive: item.isBoosterActive,
        roundingRule: presets.roundingRule,
      });
      map.set(item.id, calc);
    });
    return map;
  }, [items, presets.roundingRule]);

  // Count boncos
  const boncosCount = useMemo(() => {
    let count = 0;
    items.forEach((it) => {
      const calc = calculations.get(it.id);
      if (calc && calc.variance < 0) count++;
    });
    return count;
  }, [items, calculations]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat FoodMerchant Engine...</span>
        </div>
      </div>
    );
  }

  const isGrab = channel === 'GRABFOOD';

  return (
    <main className="max-w-360 mx-auto px-4 sm:px-6 py-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                  isGrab ? 'bg-[#00B14F]' : 'bg-[#EE2737]'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    FoodMerchant Pricing & Margin Engine
                  </h1>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    v2.0 Exact Math
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kalkulator presisi biaya komisi delivery, diskon merchant, dan anti-boncos
                  settlement
                </p>
              </div>
            </div>
          </div>

          {/* Quick Benchmark Reference Badge */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-slate-400 font-mono block">
                BENCHMARK KALIBRASI
              </span>
              <span className="text-xs font-semibold text-slate-700">
                Settlement Order GF-957 (Rp 29.753)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenReceiptModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verifikasi Struk</span>
            </button>
          </div>
        </header>

        {/* 1. Workspace Switcher (GrabFood & GoFood Tabs) */}
        <WorkspaceSwitcher
          currentChannel={channel}
          onChannelChange={handleChannelChange}
          boncosCount={boncosCount}
        />

        {/* 2. KPI Summary Cards */}
        <KpiSummaryCards
          items={items}
          calculations={calculations}
          onApplyAllIdealPrices={handleApplyAllIdealPrices}
        />

        {/* 3. Global Preset Bar */}
        <GlobalPresetBar
          channel={channel}
          presets={presets}
          onPresetsChange={handlePresetsChange}
          onApplyAllIdealPrices={handleApplyAllIdealPrices}
          onApplyPresetsToAllItems={handleApplyPresetsToAllItems}
          onResetDefaults={handleResetDefaults}
          onOpenReceiptModal={() => handleOpenReceiptModal()}
          onSyncDatabase={handleSyncDatabase}
          isSyncingDb={isSyncingDb}
          dbSyncStatus={dbSyncStatus}
        />

        {/* 4. High-Density Responsive Table */}
        <PricingTable
          channel={channel}
          items={items}
          calculations={calculations}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onApplyIdealPrice={handleApplyIdealPrice}
          onOpenReceiptModal={handleOpenReceiptModal}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onExportCsv={handleExportCsv}
        />

        {/* Footer info note */}
        <footer className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            FoodMerchant Engine • Dilengkapi PostgreSQL Schema + Row-Level Locking QRIS Idempotency
          </div>
          <div className="flex items-center gap-3">
            <span>Formula terkalibrasi ke Order GrabFood GF-957</span>
            <span>•</span>
            <span className="font-mono text-slate-500">IDR Integer Math</span>
          </div>
        </footer>
      </div>

      {/* GrabReceiptModal (GF-957 Mobile View) */}
      <GrabReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        selectedItem={selectedReceiptItem}
        roundingRule={presets.roundingRule}
        onApplyIdealPrice={handleApplyIdealPrice}
      />

      {/* AddMenuModal */}
      <AddMenuModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        channel={channel}
        presets={presets}
        onAddMenuItem={handleAddMenuItem}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-800 animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
