'use client';

import React, {
  useState,
  useMemo,
  useCallback,
  useSyncExternalStore,
  useTransition,
} from 'react';
import dynamic from 'next/dynamic';
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
  loadCategories,
  saveCategories,
  getStoredActiveChannel,
  setStoredActiveChannel,
  resetWorkspaceToDefaults,
} from '@/lib/storage';
import { exportPricingToCsv } from '@/lib/csv-helper';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { KpiSummaryCards } from '@/components/KpiSummaryCards';
import { GlobalPresetBar } from '@/components/GlobalPresetBar';
import { PricingTable } from '@/components/PricingTable';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import {
  UtensilsCrossed,
  ShieldCheck,
  CheckCircle2,
  Undo2,
} from 'lucide-react';

import { ModalSkeleton } from '@/components/ModalSkeleton';

// Lazy loaded modals with skeleton fallbacks for instant visual feedback and optimal performance
const GrabReceiptModal = dynamic(
  () => import('@/components/GrabReceiptModal').then((mod) => mod.GrabReceiptModal),
  { ssr: false, loading: () => <ModalSkeleton type="receipt" /> }
);

const GoFoodReceiptModal = dynamic(
  () => import('@/components/GoFoodReceiptModal').then((mod) => mod.GoFoodReceiptModal),
  { ssr: false, loading: () => <ModalSkeleton type="receipt" /> }
);

const AddMenuModal = dynamic(
  () => import('@/components/AddMenuModal').then((mod) => mod.AddMenuModal),
  { ssr: false, loading: () => <ModalSkeleton type="form" /> }
);

const EditMenuModal = dynamic(
  () => import('@/components/EditMenuModal').then((mod) => mod.EditMenuModal),
  { ssr: false, loading: () => <ModalSkeleton type="form" /> }
);

const ManageCategoriesModal = dynamic(
  () => import('@/components/ManageCategoriesModal').then((mod) => mod.ManageCategoriesModal),
  { ssr: false, loading: () => <ModalSkeleton type="category" /> }
);

const subscribeNoop = () => () => {};

export default function PricingEnginePage() {
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const [isPending, startTransition] = useTransition();
  const [channel, setChannel] = useState<WorkspaceChannel>(getStoredActiveChannel);
  const [items, setItems] = useState<MenuItem[]>(() => loadMenuItems(getStoredActiveChannel()));
  const [presets, setPresets] = useState<GlobalPresets>(() => loadPresets(getStoredActiveChannel()));
  const [categories, setCategories] = useState<string[]>(() => loadCategories(getStoredActiveChannel()));

  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<MenuItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Micro-interaction Highlight & Undo states
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [lastDeletedItem, setLastDeletedItem] = useState<MenuItem | null>(null);
  const [lastEditedItemBefore, setLastEditedItemBefore] = useState<MenuItem | null>(null);
  const [lastDeletedCategoryState, setLastDeletedCategoryState] = useState<{
    categoryName: string;
    prevCategories: string[];
    prevItems: MenuItem[];
  } | null>(null);
  const [undoType, setUndoType] = useState<'delete' | 'edit' | 'category' | null>(null);

  // Sync state
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<
    'idle' | 'success' | 'fallback' | 'error'
  >('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastCanUndo, setToastCanUndo] = useState(false);

  const triggerHighlight = useCallback((id: string) => {
    setHighlightedItemId(id);
    setTimeout(() => {
      setHighlightedItemId((prev) => (prev === id ? null : prev));
    }, 2200);
  }, []);

  const showToast = useCallback((msg: string, allowUndo: boolean = false) => {
    setToastMessage(msg);
    setToastCanUndo(allowUndo);
    setTimeout(() => {
      setToastMessage(null);
      setToastCanUndo(false);
    }, 4500);
  }, []);

  // Handle Channel Change with smooth transition
  const handleChannelChange = (newChannel: WorkspaceChannel) => {
    startTransition(() => {
      setChannel(newChannel);
      setStoredActiveChannel(newChannel);
      const loadedItems = loadMenuItems(newChannel);
      const loadedPresets = loadPresets(newChannel);
      const loadedCategories = loadCategories(newChannel);
      setItems(loadedItems);
      setPresets(loadedPresets);
      setCategories(loadedCategories);
    });
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
      triggerHighlight(id);
    },
    [channel, triggerHighlight]
  );

  // Delete item with Undo capability
  const handleDeleteItem = useCallback(
    (id: string) => {
      const target = items.find((it) => it.id === id);
      if (target) {
        setLastDeletedItem(target);
        setUndoType('delete');
      }
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        saveMenuItems(channel, next);
        return next;
      });
      showToast(`Menu "${target?.name || ''}" berhasil dihapus`, true);
    },
    [items, channel, showToast]
  );

  // Open Edit Modal
  const handleOpenEditModal = useCallback((item: MenuItem) => {
    setSelectedEditItem(item);
    setIsEditModalOpen(true);
  }, []);

  // Save Edited Item
  const handleSaveEditedItem = useCallback(
    (updatedItem: MenuItem) => {
      const original = items.find((it) => it.id === updatedItem.id);
      if (original) {
        setLastEditedItemBefore(original);
        setUndoType('edit');
      }

      setItems((prev) => {
        const next = prev.map((it) => (it.id === updatedItem.id ? updatedItem : it));
        saveMenuItems(channel, next);
        return next;
      });

      triggerHighlight(updatedItem.id);
      showToast(`Menu "${updatedItem.name}" berhasil diperbarui (Final)!`, true);
    },
    [channel, items, triggerHighlight, showToast]
  );

  // Undo delete, edit, or category deletion action
  const handleUndo = useCallback(() => {
    if (undoType === 'delete' && lastDeletedItem) {
      setItems((prev) => {
        const next = [lastDeletedItem, ...prev];
        saveMenuItems(channel, next);
        return next;
      });
      triggerHighlight(lastDeletedItem.id);
      setLastDeletedItem(null);
      setUndoType(null);
      showToast(`Menu "${lastDeletedItem.name}" berhasil dipulihkan`);
    } else if (undoType === 'edit' && lastEditedItemBefore) {
      setItems((prev) => {
        const next = prev.map((it) =>
          it.id === lastEditedItemBefore.id ? lastEditedItemBefore : it
        );
        saveMenuItems(channel, next);
        return next;
      });
      triggerHighlight(lastEditedItemBefore.id);
      showToast(`Perubahan menu "${lastEditedItemBefore.name}" telah dibatalkan.`);
      setLastEditedItemBefore(null);
      setUndoType(null);
    } else if (undoType === 'category' && lastDeletedCategoryState) {
      setCategories(lastDeletedCategoryState.prevCategories);
      saveCategories(channel, lastDeletedCategoryState.prevCategories);
      setItems(lastDeletedCategoryState.prevItems);
      saveMenuItems(channel, lastDeletedCategoryState.prevItems);
      showToast(`Kategori "${lastDeletedCategoryState.categoryName}" dan menu terkait berhasil dipulihkan.`);
      setLastDeletedCategoryState(null);
      setUndoType(null);
    }
  }, [
    undoType,
    lastDeletedItem,
    lastEditedItemBefore,
    lastDeletedCategoryState,
    channel,
    triggerHighlight,
    showToast,
  ]);

  // Category management handlers
  const handleUpdateCategories = useCallback(
    (newCategories: string[], updatedItems?: MenuItem[], deletedCategoryName?: string) => {
      if (deletedCategoryName) {
        setLastDeletedCategoryState({
          categoryName: deletedCategoryName,
          prevCategories: categories,
          prevItems: items,
        });
        setUndoType('category');
      }
      setCategories(newCategories);
      saveCategories(channel, newCategories);
      if (updatedItems) {
        setItems(updatedItems);
        saveMenuItems(channel, updatedItems);
      }
    },
    [channel, categories, items]
  );

  const handleAddNewCategory = useCallback(
    (newCat: string) => {
      setCategories((prev) => {
        if (prev.includes(newCat)) return prev;
        const next = [...prev, newCat];
        saveCategories(channel, next);
        return next;
      });
    },
    [channel]
  );

  // Duplicate item with highlight animation
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
      triggerHighlight(duplicated.id);
      showToast(`Menu "${duplicated.name}" berhasil diduplikasi`);
    },
    [channel, triggerHighlight, showToast]
  );

  // Add new item with highlight animation
  const handleAddMenuItem = useCallback(
    (newItem: MenuItem) => {
      setItems((prev) => {
        const next = [newItem, ...prev];
        saveMenuItems(channel, next);
        return next;
      });
      triggerHighlight(newItem.id);
      showToast(`Menu "${newItem.name}" berhasil ditambahkan`);
    },
    [channel, triggerHighlight, showToast]
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
      triggerHighlight(id);
      showToast(`Harga ideal ${newPrice.toLocaleString('id-ID')} berhasil diterapkan`);
    },
    [handleUpdateItem, triggerHighlight, showToast]
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
          presets.roundingRule,
          channel,
          item.gojekSubsidyPct ?? presets.gojekSubsidyPct ?? 25,
          item.isCoFundedPromo ?? presets.isCoFundedPromo ?? true
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
  }, [channel, presets.roundingRule, presets.gojekSubsidyPct, presets.isCoFundedPromo, showToast]);

  // Reset Defaults
  const handleResetDefaults = useCallback(() => {
    const res = resetWorkspaceToDefaults(channel);
    setItems(res.items);
    setPresets(res.presets);
    setCategories(res.categories);
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
        channel,
        gojekSubsidyPct: item.gojekSubsidyPct ?? presets.gojekSubsidyPct ?? 25,
        isCoFundedPromo: item.isCoFundedPromo ?? presets.isCoFundedPromo ?? true,
      });
      map.set(item.id, calc);
    });
    return map;
  }, [items, presets.roundingRule, presets.gojekSubsidyPct, presets.isCoFundedPromo, channel]);

  // Count boncos
  const boncosCount = useMemo(() => {
    let count = 0;
    items.forEach((it) => {
      const calc = calculations.get(it.id);
      if (calc && calc.variance < 0) count++;
    });
    return count;
  }, [items, calculations]);

  // Instant Shimmer Skeleton screen before client hydration (Zero Layout Shift)
  if (!isClient) {
    return <DashboardSkeleton />;
  }

  const isGrab = channel === 'GRABFOOD';

  return (
    <main className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen text-slate-900">
      <div className="space-y-5 sm:space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs transition-colors duration-200 ${
                isGrab
                  ? 'bg-[#00B14F] shadow-emerald-500/20'
                  : 'bg-[#EE2737] shadow-red-500/20'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950">
                  FoodMerchant Pricing & Margin Engine
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 hidden sm:inline">
                  v2.0 Precision
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5 leading-normal">
                Kalkulator presisi biaya platform, diskon mitra, dan margin bersih terkalibrasi Order GF-957
              </p>
            </div>
          </div>

          {/* Quick Benchmark Reference Badge */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="text-right hidden lg:block">
              <span className="text-[10px] text-slate-400 font-mono block">
                KALIBRASI RIIL
              </span>
              <span className="text-xs font-semibold text-slate-800 tabular-nums">
                {isGrab ? 'Order GF-957 (Rp 29.753)' : 'Order F-3388856614 & F-3392285639'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenReceiptModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
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

        {/* 4. High-Density Responsive Table with Dual View & Highlight */}
        <PricingTable
          channel={channel}
          items={items}
          calculations={calculations}
          categories={categories}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onApplyIdealPrice={handleApplyIdealPrice}
          onOpenReceiptModal={handleOpenReceiptModal}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenEditModal={handleOpenEditModal}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onExportCsv={handleExportCsv}
          highlightedItemId={highlightedItemId}
          isLoading={isPending}
        />

        {/* Footer info note */}
        <footer className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            FoodMerchant Engine • Dilengkapi PostgreSQL Schema + Row-Level Locking QRIS Idempotency
          </div>
          <div className="flex items-center gap-3">
            <span>
              {isGrab
                ? 'Formula terkalibrasi ke Order GrabFood GF-957'
                : 'Formula terkalibrasi ke Order GoFood F-3388856614 & Maksimal PRO'}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-500">IDR Integer Math</span>
          </div>
        </footer>
      </div>

      {/* Lazy Loaded GrabReceiptModal (GF-957 Mobile View) */}
      {isReceiptModalOpen && isGrab && (
        <GrabReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          selectedItem={selectedReceiptItem}
          roundingRule={presets.roundingRule}
          onApplyIdealPrice={handleApplyIdealPrice}
        />
      )}

      {/* Lazy Loaded GoFoodReceiptModal (F-3388856614 & F-3392285639 Mobile View) */}
      {isReceiptModalOpen && !isGrab && (
        <GoFoodReceiptModal
          key={selectedReceiptItem?.id ?? 'default'}
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          selectedItem={selectedReceiptItem}
          roundingRule={presets.roundingRule}
          onApplyIdealPrice={handleApplyIdealPrice}
        />
      )}

      {/* Lazy Loaded AddMenuModal */}
      {isAddModalOpen && (
        <AddMenuModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          channel={channel}
          presets={presets}
          categories={categories}
          onAddMenuItem={handleAddMenuItem}
          onAddNewCategory={handleAddNewCategory}
        />
      )}

      {/* Lazy Loaded EditMenuModal */}
      {isEditModalOpen && selectedEditItem && (
        <EditMenuModal
          key={selectedEditItem.id}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEditItem(null);
          }}
          item={selectedEditItem}
          channel={channel}
          presets={presets}
          categories={categories}
          onSaveItem={handleSaveEditedItem}
          onAddNewCategory={handleAddNewCategory}
        />
      )}

      {/* Lazy Loaded ManageCategoriesModal */}
      {isCategoryModalOpen && (
        <ManageCategoriesModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          channel={channel}
          items={items}
          onUpdateCategories={handleUpdateCategories}
          onShowToast={(msg, allowUndo) => showToast(msg, allowUndo ?? false)}
        />
      )}

      {/* Toast Notification with Undo Capability */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-800 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          {toastCanUndo &&
            (lastDeletedItem || lastEditedItemBefore || lastDeletedCategoryState) && (
              <button
                type="button"
                onClick={handleUndo}
                className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Undo2 className="w-3 h-3" />
                <span>Urungkan</span>
              </button>
            )}
        </div>
      )}
    </main>
  );
}
