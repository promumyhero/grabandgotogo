'use client';

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useSyncExternalStore,
  useTransition,
} from 'react';
import dynamic from 'next/dynamic';
import {
  AuthUser,
  DiscountTemplate,
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
  DEMO_MAX_MENU_ITEMS,
  loadMenuItems,
  saveMenuItems,
  loadPresets,
  savePresets,
  loadCategories,
  saveCategories,
  loadDiscountTemplates,
  saveDiscountTemplates,
  getStoredActiveChannel,
  setStoredActiveChannel,
  resetWorkspaceToDefaults,
  clearMerchantStorage,
  createFullBackupObject,
  restoreFullBackupObject,
} from '@/lib/storage';
import { exportPricingToCsv, parsePricingCsv } from '@/lib/csv-helper';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { KpiSummaryCards } from '@/components/KpiSummaryCards';
import { GlobalPresetBar } from '@/components/GlobalPresetBar';
import { PricingTable } from '@/components/PricingTable';
import { LandingPage } from '@/components/LandingPage';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ModalSkeleton } from '@/components/ModalSkeleton';
import {
  Undo2,
  BookOpen,
  Store,
  LogOut,
  LogIn,
  Lock,
  ShieldCheck,
  Settings,
  Home,
} from 'lucide-react';

// Lazy loaded modals with skeleton fallbacks
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

const AuthModal = dynamic(
  () => import('@/components/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

const PricingEducationModal = dynamic(
  () =>
    import('@/components/PricingEducationModal').then(
      (mod) => mod.PricingEducationModal
    ),
  { ssr: false }
);

const MerchantProfileModal = dynamic(
  () =>
    import('@/components/MerchantProfileModal').then(
      (mod) => mod.MerchantProfileModal
    ),
  { ssr: false }
);

const subscribeNoop = () => () => {};

export default function PricingEnginePage() {
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  // Auth & Tenant Isolation State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'landing' | 'calculator'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authGateReason, setAuthGateReason] = useState<string | null>(null);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const activeMerchantId = authUser?.id ?? null;

  const [isPending, startTransition] = useTransition();
  const [channel, setChannel] = useState<WorkspaceChannel>(() =>
    getStoredActiveChannel(null)
  );
  const [items, setItems] = useState<MenuItem[]>(() =>
    loadMenuItems(getStoredActiveChannel(null), null)
  );
  const [presets, setPresets] = useState<GlobalPresets>(() =>
    loadPresets(getStoredActiveChannel(null), null)
  );
  const [categories, setCategories] = useState<string[]>(() =>
    loadCategories(getStoredActiveChannel(null), null)
  );
  const [discountTemplates, setDiscountTemplates] = useState<DiscountTemplate[]>(() =>
    loadDiscountTemplates(getStoredActiveChannel(null), null)
  );

  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<MenuItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Highlight & Undo Snapshot state
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    restoreToast: string;
    prevItems: MenuItem[];
    prevCategories?: string[];
    prevPresets?: GlobalPresets;
    highlightId?: string;
  } | null>(null);

  // Sync state
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<
    'idle' | 'success' | 'fallback' | 'error'
  >('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastCanUndo, setToastCanUndo] = useState(false);

  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string, allowUndo: boolean = false) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    setToastCanUndo(allowUndo);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      setToastCanUndo(false);
    }, 5000);
  }, []);

  // Load workspace from Supabase PostgreSQL when user is authenticated
  const fetchCloudWorkspace = useCallback(
    async (targetChannel: WorkspaceChannel, merchantId: string) => {
      try {
        const res = await fetch(
          `/api/pricings/workspace?channel=${targetChannel}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data.discountTemplates)) {
          setDiscountTemplates(data.discountTemplates);
          saveDiscountTemplates(
            targetChannel,
            data.discountTemplates,
            merchantId
          );
        }

        if (data.workspace) {
          if (data.workspace.presets) {
            setPresets(data.workspace.presets);
            savePresets(targetChannel, data.workspace.presets, merchantId);
          }
          if (
            Array.isArray(data.workspace.categories) &&
            data.workspace.categories.length > 0
          ) {
            setCategories(data.workspace.categories);
            saveCategories(
              targetChannel,
              data.workspace.categories,
              merchantId
            );
          }
          if (
            Array.isArray(data.workspace.items) &&
            data.workspace.items.length > 0
          ) {
            setItems(data.workspace.items);
            saveMenuItems(targetChannel, data.workspace.items, merchantId);
          }
        }
      } catch {
        // Fallback silently to tenant-scoped localStorage
      }
    },
    []
  );

  // Check active session on mount
  useEffect(() => {
    if (!isClient) return;
    let active = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.authenticated && data?.user) {
          const user: AuthUser = data.user;
          setAuthUser(user);
          setActiveView('calculator');
          const storedCh = getStoredActiveChannel(user.id);
          setChannel(storedCh);
          setItems(loadMenuItems(storedCh, user.id));
          setPresets(loadPresets(storedCh, user.id));
          setCategories(loadCategories(storedCh, user.id));
          setDiscountTemplates(loadDiscountTemplates(storedCh, user.id));
          fetchCloudWorkspace(storedCh, user.id);
        }
      })
      .catch(() => {
        // Remain in Demo Mode if session check fails
      });
    return () => {
      active = false;
    };
  }, [isClient, fetchCloudWorkspace]);

  // Persist items to tenant-scoped localStorage whenever items or channel changes
  useEffect(() => {
    if (!isClient) return;
    saveMenuItems(channel, items, activeMerchantId);
  }, [isClient, channel, items, activeMerchantId]);

  const requireAuth = useCallback((reason: string) => {
    setAuthGateReason(reason);
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  }, []);

  const triggerHighlight = useCallback((id: string) => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    setHighlightedItemId(id);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedItemId((prev) => (prev === id ? null : prev));
    }, 1800);
  }, []);

  // Precompute calculations map for all items
  const calculations = useMemo(() => {
    const map = new Map<string, CalculationResult>();
    for (const item of items) {
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
    }
    return map;
  }, [
    items,
    presets.roundingRule,
    presets.gojekSubsidyPct,
    presets.isCoFundedPromo,
    channel,
  ]);

  // Handle Channel Change with smooth transition
  const handleChannelChange = useCallback(
    (newChannel: WorkspaceChannel) => {
      startTransition(() => {
        setChannel(newChannel);
        setStoredActiveChannel(newChannel, activeMerchantId);
        setItems(loadMenuItems(newChannel, activeMerchantId));
        setPresets(loadPresets(newChannel, activeMerchantId));
        setCategories(loadCategories(newChannel, activeMerchantId));
        setDiscountTemplates(loadDiscountTemplates(newChannel, activeMerchantId));
        setUndoSnapshot(null);
      });
      if (activeMerchantId) {
        fetchCloudWorkspace(newChannel, activeMerchantId);
      }
      showToast(
        `Beralih ke workspace ${newChannel === 'GRABFOOD' ? 'GrabFood' : 'GoFood'}`
      );
    },
    [activeMerchantId, fetchCloudWorkspace, showToast]
  );

  // Handle Login / Registration Success
  const handleAuthSuccess = useCallback(
    async (user: AuthUser, migrateDemoData: boolean) => {
      const demoItems = [...items];
      const demoPresets = { ...presets };
      const demoCategories = [...categories];

      setAuthUser(user);
      setActiveView('calculator');
      setAuthGateReason(null);

      if (migrateDemoData) {
        saveMenuItems(channel, demoItems, user.id);
        savePresets(channel, demoPresets, user.id);
        saveCategories(channel, demoCategories, user.id);
        setItems(demoItems);
        setPresets(demoPresets);
        setCategories(demoCategories);

        try {
          await fetch('/api/pricings/bulk-upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel,
              presets: demoPresets,
              categories: demoCategories,
              items: demoItems,
            }),
          });
        } catch {
          // non-blocking
        }
        showToast(
          `Selamat datang, ${user.name}! Data simulasi berhasil disimpan ke akun resto Anda.`
        );
      } else {
        setItems(loadMenuItems(channel, user.id));
        setPresets(loadPresets(channel, user.id));
        setCategories(loadCategories(channel, user.id));
        setDiscountTemplates(loadDiscountTemplates(channel, user.id));
        await fetchCloudWorkspace(channel, user.id);
        showToast(`Selamat datang kembali, ${user.name}!`);
      }
    },
    [channel, items, presets, categories, fetchCloudWorkspace, showToast]
  );

  // Handle Logout
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthUser(null);
    setUndoSnapshot(null);
    setDbSyncStatus('idle');
    setItems(loadMenuItems(channel, null));
    setPresets(loadPresets(channel, null));
    setCategories(loadCategories(channel, null));
    setDiscountTemplates(loadDiscountTemplates(channel, null));
    showToast('Anda telah keluar. Beralih kembali ke Mode Demo.');
  }, [channel, showToast]);

  // Handle Permanent Account Deletion
  const handleAccountDeleted = useCallback(
    (deletedMerchantId: string) => {
      clearMerchantStorage(deletedMerchantId);
      setAuthUser(null);
      setUndoSnapshot(null);
      setDbSyncStatus('idle');
      setItems(loadMenuItems(channel, null));
      setPresets(loadPresets(channel, null));
      setCategories(loadCategories(channel, null));
      setDiscountTemplates(loadDiscountTemplates(channel, null));
      showToast('Akun restoran dan seluruh data terkait telah dihapus permanen.');
    },
    [channel, showToast]
  );

  // Pure state update for inline table edits
  const handleUpdateItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates, updatedAt: now } : it))
    );
  }, []);

  const handleDeleteItem = useCallback(
    (id: string) => {
      const target = items.find((it) => it.id === id);
      if (target) {
        setUndoSnapshot({
          restoreToast: `Menu "${target.name}" berhasil dipulihkan`,
          prevItems: items,
          highlightId: target.id,
        });
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
      showToast(`Menu "${target?.name || ''}" dihapus`, true);
    },
    [items, showToast]
  );

  const handleBulkDeleteItems = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      setUndoSnapshot({
        restoreToast: `${ids.length} menu berhasil dipulihkan`,
        prevItems: items,
      });
      setItems((prev) => prev.filter((it) => !idSet.has(it.id)));
      showToast(`${ids.length} menu dihapus`, true);
    },
    [items, showToast]
  );

  const handleBulkApplyIdealPrices = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      setUndoSnapshot({
        restoreToast: `Harga sebelumnya untuk ${ids.length} menu dikembalikan`,
        prevItems: items,
      });
      setItems((prev) =>
        prev.map((item) => {
          if (!idSet.has(item.id)) return item;
          const calc = calculations.get(item.id);
          const idealPrice =
            calc?.recommendedDisplayPriceRounded ??
            calculateRecommendedPrice(
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
            ).roundedRecommendedPrice;
          return {
            ...item,
            displayPrice: idealPrice,
            updatedAt: now,
          };
        })
      );
      showToast(`Harga ideal diterapkan pada ${ids.length} menu`, true);
    },
    [
      items,
      calculations,
      channel,
      presets.roundingRule,
      presets.gojekSubsidyPct,
      presets.isCoFundedPromo,
      showToast,
    ]
  );

  const handleBulkUpdateItems = useCallback(
    (ids: string[], updates: Partial<MenuItem>, actionLabel: string) => {
      if (!authUser) {
        requireAuth(
          'Fitur Edit Massal (Bulk Action) hanya terbuka untuk Akun Resto terdaftar.'
        );
        return;
      }
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      setUndoSnapshot({
        restoreToast: `Perubahan massal (${actionLabel}) dibatalkan`,
        prevItems: items,
      });
      setItems((prev) =>
        prev.map((it) =>
          idSet.has(it.id) ? { ...it, ...updates, updatedAt: now } : it
        )
      );
      showToast(`${actionLabel} diterapkan pada ${ids.length} menu`, true);
    },
    [authUser, requireAuth, items, showToast]
  );

  const handleOpenEditModal = useCallback((item: MenuItem) => {
    setSelectedEditItem(item);
    setIsEditModalOpen(true);
  }, []);

  const handleOpenAddModal = useCallback(() => {
    if (!authUser && items.length >= DEMO_MAX_MENU_ITEMS) {
      requireAuth(
        `Mode Demo dibatasi maksimal ${DEMO_MAX_MENU_ITEMS} menu. Masuk atau Daftar Akun Resto gratis untuk menambah menu tanpa batas.`
      );
      return;
    }
    setIsAddModalOpen(true);
  }, [authUser, items.length, requireAuth]);

  const handleOpenCategoryModal = useCallback(() => {
    if (!authUser) {
      requireAuth(
        'Fitur Kelola & Kustomisasi Kategori Resto memerlukan Akun Resto terdaftar.'
      );
      return;
    }
    setIsCategoryModalOpen(true);
  }, [authUser, requireAuth]);

  const handleSaveEditedItem = useCallback(
    (updatedItem: MenuItem) => {
      const original = items.find((it) => it.id === updatedItem.id);
      if (original) {
        setUndoSnapshot({
          restoreToast: `Perubahan menu "${original.name}" dibatalkan`,
          prevItems: items,
          highlightId: original.id,
        });
      }

      setItems((prev) =>
        prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
      );

      triggerHighlight(updatedItem.id);
      showToast(`Menu "${updatedItem.name}" diperbarui`, true);
    },
    [items, triggerHighlight, showToast]
  );

  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return;
    setItems(undoSnapshot.prevItems);

    if (undoSnapshot.prevCategories) {
      setCategories(undoSnapshot.prevCategories);
      saveCategories(channel, undoSnapshot.prevCategories, activeMerchantId);
    }
    if (undoSnapshot.prevPresets) {
      setPresets(undoSnapshot.prevPresets);
      savePresets(channel, undoSnapshot.prevPresets, activeMerchantId);
    }
    if (undoSnapshot.highlightId) {
      triggerHighlight(undoSnapshot.highlightId);
    }
    showToast(undoSnapshot.restoreToast, false);
    setUndoSnapshot(null);
  }, [undoSnapshot, channel, activeMerchantId, triggerHighlight, showToast]);

  const handleUpdateCategories = useCallback(
    (
      newCategories: string[],
      updatedItems?: MenuItem[],
      deletedCategoryName?: string
    ) => {
      if (deletedCategoryName) {
        setUndoSnapshot({
          restoreToast: `Kategori "${deletedCategoryName}" berhasil dipulihkan`,
          prevCategories: categories,
          prevItems: items,
        });
      }
      setCategories(newCategories);
      saveCategories(channel, newCategories, activeMerchantId);
      if (updatedItems) {
        setItems(updatedItems);
      }
    },
    [channel, categories, items, activeMerchantId]
  );

  const handleAddNewCategory = useCallback(
    (newCat: string) => {
      setCategories((prev) => {
        if (prev.includes(newCat)) return prev;
        const next = [...prev, newCat];
        saveCategories(channel, next, activeMerchantId);
        return next;
      });
    },
    [channel, activeMerchantId]
  );

  const handleDuplicateItem = useCallback(
    (item: MenuItem) => {
      if (!authUser && items.length >= DEMO_MAX_MENU_ITEMS) {
        requireAuth(
          `Mode Demo dibatasi maksimal ${DEMO_MAX_MENU_ITEMS} menu. Masuk ke Akun Resto untuk menduplikasi lebih banyak menu.`
        );
        return;
      }
      const now = new Date().toISOString();
      const suffix = Math.random().toString(36).slice(2, 6);
      const duplicated: MenuItem = {
        ...item,
        id: `${channel.toLowerCase()}-${Date.now()}-${suffix}`,
        name: `${item.name} (Salinan)`,
        createdAt: now,
        updatedAt: now,
      };
      setItems((prev) => [duplicated, ...prev]);
      triggerHighlight(duplicated.id);
      showToast(`Menu "${duplicated.name}" diduplikasi`);
    },
    [authUser, items.length, requireAuth, channel, triggerHighlight, showToast]
  );

  const handleAddMenuItem = useCallback(
    (newItem: MenuItem) => {
      setItems((prev) => [newItem, ...prev]);
      triggerHighlight(newItem.id);
      showToast(`Menu "${newItem.name}" ditambahkan`);
    },
    [triggerHighlight, showToast]
  );

  const handlePresetsChange = useCallback(
    (newPresets: GlobalPresets) => {
      setPresets(newPresets);
      savePresets(channel, newPresets, activeMerchantId);
    },
    [channel, activeMerchantId]
  );

  // Apply a Resto Discount Template
  const handleApplyDiscountTemplate = useCallback(
    (tpl: DiscountTemplate) => {
      const nextPresets: GlobalPresets = {
        platformCommissionPct: tpl.platformCommissionPct,
        marketingBoosterPct: tpl.marketingBoosterPct,
        merchantDiscountType: tpl.merchantDiscountType,
        merchantDiscountValue: tpl.merchantDiscountValue,
        roundingRule: tpl.roundingRule,
        isBoosterActiveDefault: tpl.isBoosterActiveDefault,
        gojekSubsidyPct: tpl.gojekSubsidyPct ?? presets.gojekSubsidyPct ?? 25,
        isCoFundedPromo: tpl.isCoFundedPromo ?? presets.isCoFundedPromo ?? true,
      };
      setPresets(nextPresets);
      savePresets(channel, nextPresets, activeMerchantId);
      showToast(`Skema promo "${tpl.name}" diterapkan ke parameter resto`);
    },
    [channel, activeMerchantId, presets.gojekSubsidyPct, presets.isCoFundedPromo, showToast]
  );

  // Save a new Custom Resto Discount Template
  const handleSaveCustomTemplate = useCallback(
    (name: string) => {
      const newTemplate: DiscountTemplate = {
        id: `custom-${channel.toLowerCase()}-${Date.now()}`,
        name,
        channel,
        platformCommissionPct: presets.platformCommissionPct,
        marketingBoosterPct: presets.marketingBoosterPct,
        isBoosterActiveDefault: presets.isBoosterActiveDefault,
        merchantDiscountType: presets.merchantDiscountType,
        merchantDiscountValue: presets.merchantDiscountValue,
        gojekSubsidyPct: presets.gojekSubsidyPct ?? 25,
        isCoFundedPromo: presets.isCoFundedPromo ?? true,
        roundingRule: presets.roundingRule,
        isBuiltIn: false,
      };

      setDiscountTemplates((prev) => {
        const next = [...prev, newTemplate];
        saveDiscountTemplates(channel, next, activeMerchantId);
        return next;
      });
      showToast(`Skema promo resto "${name}" berhasil disimpan`);
    },
    [channel, presets, activeMerchantId, showToast]
  );

  const handleDeleteCustomTemplate = useCallback(
    (templateId: string) => {
      setDiscountTemplates((prev) => {
        const next = prev.filter((t) => t.id !== templateId);
        saveDiscountTemplates(channel, next, activeMerchantId);
        return next;
      });
      showToast('Skema promo kustom dihapus');
    },
    [channel, activeMerchantId, showToast]
  );

  const handleApplyPresetsToAllItems = useCallback(() => {
    const now = new Date().toISOString();
    setUndoSnapshot({
      restoreToast: 'Parameter menu sebelum sinkronisasi dikembalikan',
      prevItems: items,
    });
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        platformCommissionPct: presets.platformCommissionPct,
        marketingBoosterPct: presets.marketingBoosterPct,
        merchantDiscountValue: presets.merchantDiscountValue,
        merchantDiscountType: presets.merchantDiscountType,
        isBoosterActive: presets.isBoosterActiveDefault,
        gojekSubsidyPct: presets.gojekSubsidyPct ?? item.gojekSubsidyPct ?? 25,
        isCoFundedPromo: presets.isCoFundedPromo ?? item.isCoFundedPromo ?? true,
        updatedAt: now,
      }))
    );
    showToast('Parameter default diterapkan ke semua menu', true);
  }, [items, presets, showToast]);

  const handleApplyIdealPrice = useCallback(
    (id: string, newPrice: number) => {
      handleUpdateItem(id, { displayPrice: newPrice });
      triggerHighlight(id);
      showToast(`Harga ideal Rp ${newPrice.toLocaleString('id-ID')} diterapkan`);
    },
    [handleUpdateItem, triggerHighlight, showToast]
  );

  const handleApplyAllIdealPrices = useCallback(() => {
    const now = new Date().toISOString();
    setUndoSnapshot({
      restoreToast: 'Harga menu sebelum penyesuaian massal dikembalikan',
      prevItems: items,
    });
    setItems((prev) =>
      prev.map((item) => {
        const calc = calculations.get(item.id);
        const idealPrice =
          calc?.recommendedDisplayPriceRounded ??
          calculateRecommendedPrice(
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
          ).roundedRecommendedPrice;
        return {
          ...item,
          displayPrice: idealPrice,
          updatedAt: now,
        };
      })
    );
    showToast('Semua menu telah disesuaikan ke Harga Ideal', true);
  }, [
    channel,
    items,
    calculations,
    presets.roundingRule,
    presets.gojekSubsidyPct,
    presets.isCoFundedPromo,
    showToast,
  ]);

  // ==========================================
  // GRANULAR RESET & CROSS-CHANNEL COPY ACTIONS
  // ==========================================

  // 1. Kosongkan Semua Menu (Blank Slate)
  const handleResetEmptyMenu = useCallback(() => {
    if (items.length === 0) {
      showToast('Daftar menu sudah kosong');
      return;
    }
    setUndoSnapshot({
      restoreToast: `${items.length} menu sebelum dikosongkan berhasil dipulihkan`,
      prevItems: items,
    });
    setItems([]);
    showToast('Semua menu dikosongkan. Silakan tambah menu asli resto Anda.', true);
  }, [items, showToast]);

  // 2. Reset Semua Diskon ke 0% (Mode Tanpa Promo)
  const handleResetZeroDiscounts = useCallback(() => {
    const now = new Date().toISOString();
    setUndoSnapshot({
      restoreToast: 'Nilai diskon menu sebelumnya berhasil dipulihkan',
      prevItems: items,
      prevPresets: presets,
    });
    const nextPresets: GlobalPresets = {
      ...presets,
      merchantDiscountValue: 0,
    };
    setPresets(nextPresets);
    savePresets(channel, nextPresets, activeMerchantId);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        merchantDiscountValue: 0,
        updatedAt: now,
      }))
    );
    showToast('Semua diskon menu di-reset ke 0% (Mode Tanpa Promo)', true);
  }, [items, presets, channel, activeMerchantId, showToast]);

  // 3. Reset Harga Tayang = Harga Offline (0% Markup)
  const handleResetDisplayToOffline = useCallback(() => {
    const now = new Date().toISOString();
    setUndoSnapshot({
      restoreToast: 'Harga tayang menu sebelumnya berhasil dipulihkan',
      prevItems: items,
    });
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        displayPrice: it.targetOfflinePrice,
        updatedAt: now,
      }))
    );
    showToast('Semua Harga Tayang di-reset sama dengan Harga Offline', true);
  }, [items, showToast]);

  // 4. Salin Menu dari Channel Sebelah (GrabFood <-> GoFood) + Hitung Harga Ideal Otomatis
  const handleCopyFromOtherChannel = useCallback(() => {
    const otherChannel: WorkspaceChannel =
      channel === 'GRABFOOD' ? 'GOFOOD' : 'GRABFOOD';
    const sourceItems = loadMenuItems(otherChannel, activeMerchantId);

    if (sourceItems.length === 0) {
      showToast(
        `Tidak ada menu di ${otherChannel === 'GRABFOOD' ? 'GrabFood' : 'GoFood'} untuk disalin.`
      );
      return;
    }

    const now = new Date().toISOString();
    setUndoSnapshot({
      restoreToast: `Daftar menu sebelum penyalinan dari ${
        otherChannel === 'GRABFOOD' ? 'GrabFood' : 'GoFood'
      } dipulihkan`,
      prevItems: items,
      prevCategories: categories,
    });

    const copiedItems: MenuItem[] = sourceItems.map((src, idx) => {
      const rec = calculateRecommendedPrice(
        src.targetOfflinePrice,
        presets.merchantDiscountType,
        presets.merchantDiscountValue,
        presets.platformCommissionPct,
        presets.marketingBoosterPct,
        channel === 'GRABFOOD' ? presets.isBoosterActiveDefault : false,
        presets.roundingRule,
        channel,
        presets.gojekSubsidyPct ?? 25,
        presets.isCoFundedPromo ?? true
      );

      return {
        id: `${channel.toLowerCase()}-copy-${Date.now()}-${idx}`,
        name: src.name,
        category: src.category,
        channel,
        targetOfflinePrice: src.targetOfflinePrice,
        displayPrice: rec.roundedRecommendedPrice,
        merchantDiscountType: presets.merchantDiscountType,
        merchantDiscountValue: presets.merchantDiscountValue,
        platformCommissionPct: presets.platformCommissionPct,
        marketingBoosterPct: presets.marketingBoosterPct,
        isBoosterActive:
          channel === 'GRABFOOD' ? presets.isBoosterActiveDefault : false,
        gojekSubsidyPct: presets.gojekSubsidyPct ?? 25,
        isCoFundedPromo: presets.isCoFundedPromo ?? true,
        notes: `Disalin dari ${
          otherChannel === 'GRABFOOD' ? 'GrabFood' : 'GoFood'
        } (Harga Ideal Otomatis)`,
        createdAt: now,
        updatedAt: now,
      };
    });

    const mergedCats = Array.from(
      new Set([...categories, ...sourceItems.map((s) => s.category)])
    );
    if (mergedCats.length !== categories.length) {
      setCategories(mergedCats);
      saveCategories(channel, mergedCats, activeMerchantId);
    }

    setItems(copiedItems);
    showToast(
      `Berhasil menyalin ${copiedItems.length} menu dari ${
        otherChannel === 'GRABFOOD' ? 'GrabFood' : 'GoFood'
      } beserta Harga Idealnya`,
      true
    );
  }, [channel, activeMerchantId, items, categories, presets, showToast]);

  // 5. Kembalikan ke Menu Contoh Default
  const handleResetDefaults = useCallback(() => {
    setUndoSnapshot({
      restoreToast: 'Data workspace sebelum reset dipulihkan',
      prevItems: items,
      prevCategories: categories,
      prevPresets: presets,
    });
    const res = resetWorkspaceToDefaults(channel, activeMerchantId);
    setItems(res.items);
    setPresets(res.presets);
    setCategories(res.categories);
    showToast('Workspace dikembalikan ke menu contoh bawaan', true);
  }, [channel, activeMerchantId, items, categories, presets, showToast]);

  // JSON Backup & Restore
  const handleExportBackupJson = useCallback(() => {
    const backup = createFullBackupObject(
      activeMerchantId,
      authUser?.name || 'Resto'
    );
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (authUser?.name || 'resto')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `backup-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File Backup (.JSON) berhasil diunduh');
  }, [activeMerchantId, authUser, showToast]);

  const handleImportBackupJson = useCallback(
    (rawJson: string) => {
      const res = restoreFullBackupObject(rawJson, activeMerchantId);
      if (!res.success) {
        showToast(res.error || 'Gagal memulihkan file backup');
        return;
      }
      setItems(loadMenuItems(channel, activeMerchantId));
      setPresets(loadPresets(channel, activeMerchantId));
      setCategories(loadCategories(channel, activeMerchantId));
      setDiscountTemplates(loadDiscountTemplates(channel, activeMerchantId));
      showToast('Seluruh data resto berhasil dipulihkan dari file Backup JSON!');
    },
    [channel, activeMerchantId, showToast]
  );

  const handleOpenReceiptModal = useCallback((item?: MenuItem) => {
    setSelectedReceiptItem(item ?? null);
    setIsReceiptModalOpen(true);
  }, []);

  const handleOpenDefaultReceiptModal = useCallback(() => {
    setSelectedReceiptItem(null);
    setIsReceiptModalOpen(true);
  }, []);

  const handleExportCsv = useCallback(
    (targetItems?: MenuItem[]) => {
      if (!authUser) {
        requireAuth(
          'Fitur Export Laporan CSV hanya tersedia untuk Akun Resto terdaftar.'
        );
        return;
      }
      const listToExport =
        targetItems && targetItems.length > 0 ? targetItems : items;
      exportPricingToCsv(listToExport, calculations, channel);
      showToast(
        targetItems && targetItems.length > 0
          ? `CSV (${targetItems.length} menu) berhasil diunduh`
          : 'CSV seluruh menu berhasil diunduh'
      );
    },
    [authUser, requireAuth, items, calculations, channel, showToast]
  );

  const handleImportCsv = useCallback(
    (rawCsvText: string) => {
      if (!authUser) {
        requireAuth(
          'Fitur Import Menu Massal dari CSV memerlukan Akun Resto terdaftar.'
        );
        return;
      }
      const result = parsePricingCsv(rawCsvText, channel, presets);
      if (result.items.length === 0) {
        showToast('Tidak ada data menu valid pada file CSV');
        return;
      }

      setUndoSnapshot({
        restoreToast: `Impor ${result.items.length} menu dari CSV dibatalkan`,
        prevItems: items,
        prevCategories: categories,
      });

      const mergedCategories = Array.from(
        new Set([...categories, ...result.discoveredCategories])
      );
      if (mergedCategories.length !== categories.length) {
        setCategories(mergedCategories);
        saveCategories(channel, mergedCategories, activeMerchantId);
      }

      setItems([...result.items, ...items]);

      if (result.items[0]) {
        triggerHighlight(result.items[0].id);
      }

      showToast(
        `Berhasil mengimpor ${result.items.length} menu${
          result.skippedCount > 0
            ? ` (${result.skippedCount} baris dilewati)`
            : ''
        }`,
        true
      );
    },
    [
      authUser,
      requireAuth,
      channel,
      presets,
      items,
      categories,
      activeMerchantId,
      triggerHighlight,
      showToast,
    ]
  );

  const handleSyncDatabase = useCallback(async () => {
    if (!authUser) {
      requireAuth(
        'Masuk atau Daftar Akun Resto untuk menyimpan daftar menu & skema diskon Anda ke Supabase Cloud Database.'
      );
      return;
    }

    setIsSyncingDb(true);
    setDbSyncStatus('idle');

    try {
      const response = await fetch('/api/pricings/bulk-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          presets,
          categories,
          discountTemplates,
          items,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.source === 'supabase_postgres' || data.source === 'postgres') {
          setDbSyncStatus('success');
          showToast(
            `Tersimpan di Supabase Cloud (${data.savedCount} menu • ${authUser.name})`
          );
        } else {
          setDbSyncStatus('fallback');
          showToast('Tersimpan di penyimpanan akun lokal');
        }
      } else {
        setDbSyncStatus('error');
        showToast(`Gagal sinkronisasi: ${data.error || 'Server error'}`);
      }
    } catch {
      setDbSyncStatus('fallback');
      showToast('Mode offline: data tersimpan di browser');
    } finally {
      setIsSyncingDb(false);
    }
  }, [
    authUser,
    requireAuth,
    channel,
    presets,
    categories,
    discountTemplates,
    items,
    showToast,
  ]);

  if (!isClient) {
    return <DashboardSkeleton />;
  }

  const isGrab = channel === 'GRABFOOD';
  const otherChannelItemsCount = loadMenuItems(
    isGrab ? 'GOFOOD' : 'GRABFOOD',
    activeMerchantId
  ).length;

  return (
    <>
      {activeView === 'landing' ? (
        <LandingPage
          authUser={authUser}
          onEnterCalculator={() => setActiveView('calculator')}
          onOpenAuthModal={(mode) => {
            setAuthGateReason(null);
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onOpenEducationModal={() => setIsEducationModalOpen(true)}
        />
      ) : (
        <main className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen text-slate-900">
          <div className="space-y-5">
            {/* Clean Minimalist Header with Auth, Profile & Education Actions */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveView('landing')}
                    className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 hover:text-slate-700 transition-colors cursor-pointer text-left"
                    title="Kembali ke Halaman Beranda & Penjelasan"
                  >
                    FoodMerchant Pricing Engine
                  </button>
                  {authUser ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Akun Resto Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Mode Demo (Maks. {DEMO_MAX_MENU_ITEMS} Menu)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kalkulasi komisi platform, skema promosi bersama, dan margin bersih mitra kuliner
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Back to Landing Page Button */}
                <button
                  type="button"
                  onClick={() => setActiveView('landing')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>Beranda</span>
                </button>

                {/* Interactive Calculation Guide Button */}
                <button
                  type="button"
                  onClick={() => setIsEducationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                  Cara Hitung & Bedah Rumus
                </button>

            {/* Auth Profile / Login Gate */}
            {authUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Buka Pengaturan Profil Resto, Reset Menu & Keamanan Akun"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-slate-700" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 leading-none">
                      {authUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-none mt-0.5">
                      Profil & Pengaturan
                    </div>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-slate-500 ml-1" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Keluar dari akun restoran"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateReason(null);
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk / Daftar Resto
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Demo Mode Notice Banner */}
        {!authUser && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Anda sedang menggunakan <strong>Mode Demo Terbatas</strong> (maksimal{' '}
                {DEMO_MAX_MENU_ITEMS} menu). Daftar akun resto gratis untuk membuka{' '}
                <strong>Simpan Cloud Supabase</strong>,{' '}
                <strong>Template Skema Promo Resto</strong>, dan{' '}
                <strong>Import/Export CSV</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthGateReason(null);
                setAuthModalMode('register');
                setIsAuthModalOpen(true);
              }}
              className="shrink-0 font-bold text-amber-950 underline hover:text-amber-700 cursor-pointer"
            >
              Buat Akun Resto Gratis →
            </button>
          </div>
        )}

        {/* 1. Workspace Switcher */}
        <WorkspaceSwitcher
          currentChannel={channel}
          onChannelChange={handleChannelChange}
        />

        {/* 2. KPI Summary Cards */}
        <KpiSummaryCards
          items={items}
          calculations={calculations}
          onApplyAllIdealPrices={handleApplyAllIdealPrices}
        />

        {/* 3. Global Preset Bar with Custom Resto Discount Templates & Granular Reset */}
        <GlobalPresetBar
          channel={channel}
          presets={presets}
          onPresetsChange={handlePresetsChange}
          onApplyAllIdealPrices={handleApplyAllIdealPrices}
          onApplyPresetsToAllItems={handleApplyPresetsToAllItems}
          onResetDefaults={handleResetDefaults}
          onResetEmptyMenu={handleResetEmptyMenu}
          onResetZeroDiscounts={handleResetZeroDiscounts}
          onResetDisplayToOffline={handleResetDisplayToOffline}
          onCopyFromOtherChannel={handleCopyFromOtherChannel}
          onOpenReceiptModal={handleOpenDefaultReceiptModal}
          onSyncDatabase={handleSyncDatabase}
          isSyncingDb={isSyncingDb}
          dbSyncStatus={dbSyncStatus}
          isAuthenticated={Boolean(authUser)}
          discountTemplates={discountTemplates}
          onApplyTemplate={handleApplyDiscountTemplate}
          onSaveCustomTemplate={handleSaveCustomTemplate}
          onDeleteCustomTemplate={handleDeleteCustomTemplate}
          onRequireAuth={requireAuth}
        />

        {/* 4. Responsive Pricing Table */}
        <PricingTable
          channel={channel}
          items={items}
          calculations={calculations}
          categories={categories}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onApplyIdealPrice={handleApplyIdealPrice}
          onBulkDeleteItems={handleBulkDeleteItems}
          onBulkApplyIdealPrices={handleBulkApplyIdealPrices}
          onBulkUpdateItems={handleBulkUpdateItems}
          onOpenReceiptModal={handleOpenReceiptModal}
          onOpenAddModal={handleOpenAddModal}
          onOpenEditModal={handleOpenEditModal}
          onOpenCategoryModal={handleOpenCategoryModal}
          onExportCsv={handleExportCsv}
          onImportCsv={handleImportCsv}
          highlightedItemId={highlightedItemId}
          isLoading={isPending}
        />

        {/* Minimalist Footer */}
        <footer className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            FoodMerchant Pricing Engine •{' '}
            {authUser ? `Workspace: ${authUser.name}` : 'Mode Simulasi Demo'}
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>{isGrab ? 'GrabFood Settlement' : 'GoFood Maksimal PRO'}</span>
            <span>·</span>
            <span>Supabase PostgreSQL Ready</span>
          </div>
        </footer>
      </div>
        </main>
      )}

      {/* Modals */}
      {isAuthModalOpen && (
        <AuthModal
          key={authModalMode}
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setAuthGateReason(null);
          }}
          initialMode={authModalMode}
          gateReason={authGateReason}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {isProfileModalOpen && authUser && (
        <MerchantProfileModal
          key={`${authUser.id}-${authUser.name}-${authUser.email}`}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={authUser}
          channel={channel}
          currentItems={items}
          otherChannelItemsCount={otherChannelItemsCount}
          calculations={calculations}
          onProfileUpdated={(updatedUser) => {
            setAuthUser(updatedUser);
            showToast(`Profil "${updatedUser.name}" berhasil diperbarui`);
          }}
          onAccountDeleted={handleAccountDeleted}
          onExportBackupJson={handleExportBackupJson}
          onImportBackupJson={handleImportBackupJson}
          onResetEmptyMenu={handleResetEmptyMenu}
          onResetZeroDiscounts={handleResetZeroDiscounts}
          onResetDisplayToOffline={handleResetDisplayToOffline}
          onCopyFromOtherChannel={handleCopyFromOtherChannel}
          onResetDefaults={handleResetDefaults}
        />
      )}

      {isEducationModalOpen && (
        <PricingEducationModal
          isOpen={isEducationModalOpen}
          onClose={() => setIsEducationModalOpen(false)}
        />
      )}

      {isReceiptModalOpen && isGrab && (
        <GrabReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          selectedItem={selectedReceiptItem}
          roundingRule={presets.roundingRule}
          onApplyIdealPrice={handleApplyIdealPrice}
        />
      )}

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

      {isAddModalOpen && (
        <AddMenuModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          channel={channel}
          presets={presets}
          categories={categories}
          existingItems={items}
          onAddMenuItem={handleAddMenuItem}
          onAddNewCategory={handleAddNewCategory}
        />
      )}

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
          existingItems={items}
          onSaveItem={handleSaveEditedItem}
          onAddNewCategory={handleAddNewCategory}
        />
      )}

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

      {/* Accessible Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-slate-800"
        >
          <span>{toastMessage}</span>
          {toastCanUndo && undoSnapshot && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              <Undo2 className="w-3 h-3" />
              <span>Urungkan</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
