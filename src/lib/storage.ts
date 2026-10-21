import { GlobalPresets, MenuItem, WorkspaceChannel } from '@/types/pricing';

export const DEFAULT_GRAB_PRESETS: GlobalPresets = {
  platformCommissionPct: 20,
  marketingBoosterPct: 14,
  merchantDiscountValue: 30,
  merchantDiscountType: 'PERCENT',
  roundingRule: 'CEIL_500',
  isBoosterActiveDefault: true,
};

export const DEFAULT_GOFOOD_PRESETS: GlobalPresets = {
  platformCommissionPct: 20,
  marketingBoosterPct: 0,
  merchantDiscountValue: 10,
  merchantDiscountType: 'PERCENT',
  roundingRule: 'CEIL_500',
  isBoosterActiveDefault: false,
  gojekSubsidyPct: 25, // Gojek Maksimal PRO subsidi 25% (mitra 75%)
  isCoFundedPromo: true,
};

export const INITIAL_GRAB_MENU_ITEMS: MenuItem[] = [
  {
    id: 'gf-item-1',
    name: 'Nasi Pecel Ayam Goreng',
    category: 'Paket Nasi',
    channel: 'GRABFOOD',
    targetOfflinePrice: 30000,
    displayPrice: 64400,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 30,
    platformCommissionPct: 20,
    marketingBoosterPct: 14,
    isBoosterActive: true,
    notes: 'Reference Case GF-957: Payout Rp 29.753 (Variance -Rp 247)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gf-item-2',
    name: 'Bebek Goreng Kremes Sambal Korek',
    category: 'Menu Spesial',
    channel: 'GRABFOOD',
    targetOfflinePrice: 42000,
    displayPrice: 85000,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 30,
    platformCommissionPct: 20,
    marketingBoosterPct: 14,
    isBoosterActive: true,
    notes: 'Menu Best Seller Akhir Pekan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gf-item-3',
    name: 'Es Teh Manis Jumbo (3 Gelas)',
    category: 'Minuman',
    channel: 'GRABFOOD',
    targetOfflinePrice: 15000,
    displayPrice: 28000,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 20,
    platformCommissionPct: 20,
    marketingBoosterPct: 14,
    isBoosterActive: false,
    notes: 'Margin Aman (Booster Nonaktif)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gf-item-4',
    name: 'Paket Ayam Geprek Keju Mozarella',
    category: 'Paket Nasi',
    channel: 'GRABFOOD',
    targetOfflinePrice: 28000,
    displayPrice: 48000,
    merchantDiscountType: 'NOMINAL',
    merchantDiscountValue: 10000,
    platformCommissionPct: 20,
    marketingBoosterPct: 14,
    isBoosterActive: true,
    notes: 'Diskon Merchant Nominal Rp 10.000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_GOFOOD_MENU_ITEMS: MenuItem[] = [
  {
    id: 'go-order-f3388856614',
    name: 'Paket Hemat Ayam (Order F-3388856614)',
    category: 'Paket Nasi',
    channel: 'GOFOOD',
    targetOfflinePrice: 28000,
    displayPrice: 45950,
    merchantDiscountType: 'NOMINAL',
    merchantDiscountValue: 4600, // Diskon konsumen Rp 4.600
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25, // Gojek 25% (Rp 1.150), Mitra 75% (Rp 3.450)
    isCoFundedPromo: true,
    notes: 'Struk Nyata F-3388856614: Payout Rp 33.200 (Surplus +Rp 5.200 vs Offline 28k)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'go-order-f3392285639',
    name: 'Nasi Pecel (Order F-3392285639 - Boncos)',
    category: 'Paket Nasi',
    channel: 'GOFOOD',
    targetOfflinePrice: 28000,
    displayPrice: 47850,
    merchantDiscountType: 'NOMINAL',
    merchantDiscountValue: 20160, // Diskon voucher konsumen Rp 20.160
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25, // Mitra 75% (Rp 15.120), Gojek 25% (Rp 5.040)
    isCoFundedPromo: true,
    notes: 'Struk Nyata F-3392285639: Payout Rp 25.384 (Defisit -Rp 2.616 vs Offline Rp 28k)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'go-pecel-test-48550',
    name: 'Nasi Pecel (Uji Coba Rp 48.550)',
    category: 'Paket Nasi',
    channel: 'GOFOOD',
    targetOfflinePrice: 28000,
    displayPrice: 48550,
    merchantDiscountType: 'NOMINAL',
    merchantDiscountValue: 20160,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25,
    isCoFundedPromo: true,
    notes: 'Uji Coba Rp 48.550: Payout Rp 25.944 (Masih Defisit -Rp 2.056! Butuh min Rp 51.500)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'go-item-2',
    name: 'Bebek Goreng Kremes Sambal Korek (GoFood)',
    category: 'Menu Spesial',
    channel: 'GOFOOD',
    targetOfflinePrice: 42000,
    displayPrice: 65000,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 15,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25,
    isCoFundedPromo: true,
    notes: 'Maksimal PRO Disubsidi 25%',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'go-item-3',
    name: 'Es Teh Manis Jumbo (GoFood)',
    category: 'Minuman',
    channel: 'GOFOOD',
    targetOfflinePrice: 15000,
    displayPrice: 24000,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 10,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25,
    isCoFundedPromo: true,
    notes: 'Minuman Segar Margin Aman',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_GRAB_CATEGORIES: string[] = [
  'Paket Nasi',
  'Menu Spesial',
  'Minuman',
  'Camilan / Snack',
];

export const DEFAULT_GOFOOD_CATEGORIES: string[] = [
  'Paket Nasi',
  'Menu Spesial',
  'Minuman',
  'Camilan / Snack',
  'GoFood Best Seller',
];

const STORAGE_KEYS = {
  GRABFOOD_ITEMS: 'fmp_grabfood_items_v2',
  GOFOOD_ITEMS: 'fmp_gofood_items_v3',
  GRABFOOD_PRESETS: 'fmp_grabfood_presets_v2',
  GOFOOD_PRESETS: 'fmp_gofood_presets_v3',
  GRABFOOD_CATEGORIES: 'fmp_grabfood_categories_v1',
  GOFOOD_CATEGORIES: 'fmp_gofood_categories_v1',
  ACTIVE_CHANNEL: 'fmp_active_channel_v2',
};

export function loadCategories(channel: WorkspaceChannel): string[] {
  const fallback =
    channel === 'GOFOOD' ? DEFAULT_GOFOOD_CATEGORIES : DEFAULT_GRAB_CATEGORIES;
  if (typeof window === 'undefined') return fallback;
  try {
    const key =
      channel === 'GOFOOD'
        ? STORAGE_KEYS.GOFOOD_CATEGORIES
        : STORAGE_KEYS.GRABFOOD_CATEGORIES;
    const raw = localStorage.getItem(key);
    if (!raw) {
      saveCategories(channel, fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch (e) {
    console.error('Failed to load categories from localStorage:', e);
    return fallback;
  }
}

export function saveCategories(channel: WorkspaceChannel, categories: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key =
      channel === 'GOFOOD'
        ? STORAGE_KEYS.GOFOOD_CATEGORIES
        : STORAGE_KEYS.GRABFOOD_CATEGORIES;
    localStorage.setItem(key, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories to localStorage:', e);
  }
}

export function getStoredActiveChannel(): WorkspaceChannel {
  if (typeof window === 'undefined') return 'GRABFOOD';
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHANNEL);
    return val === 'GOFOOD' ? 'GOFOOD' : 'GRABFOOD';
  } catch {
    return 'GRABFOOD';
  }
}

export function setStoredActiveChannel(channel: WorkspaceChannel): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHANNEL, channel);
  } catch {
    // ignore
  }
}

export function loadMenuItems(channel: WorkspaceChannel): MenuItem[] {
  if (typeof window === 'undefined') {
    return channel === 'GOFOOD' ? INITIAL_GOFOOD_MENU_ITEMS : INITIAL_GRAB_MENU_ITEMS;
  }
  try {
    const key =
      channel === 'GOFOOD'
        ? STORAGE_KEYS.GOFOOD_ITEMS
        : STORAGE_KEYS.GRABFOOD_ITEMS;
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial =
        channel === 'GOFOOD' ? INITIAL_GOFOOD_MENU_ITEMS : INITIAL_GRAB_MENU_ITEMS;
      saveMenuItems(channel, initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : (channel === 'GOFOOD' ? INITIAL_GOFOOD_MENU_ITEMS : INITIAL_GRAB_MENU_ITEMS);
  } catch (e) {
    console.error('Failed to load menu items from localStorage:', e);
    return channel === 'GOFOOD' ? INITIAL_GOFOOD_MENU_ITEMS : INITIAL_GRAB_MENU_ITEMS;
  }
}

export function saveMenuItems(channel: WorkspaceChannel, items: MenuItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key =
      channel === 'GOFOOD'
        ? STORAGE_KEYS.GOFOOD_ITEMS
        : STORAGE_KEYS.GRABFOOD_ITEMS;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save menu items to localStorage:', e);
  }
}

export function loadPresets(channel: WorkspaceChannel): GlobalPresets {
  const fallback =
    channel === 'GOFOOD' ? DEFAULT_GOFOOD_PRESETS : DEFAULT_GRAB_PRESETS;
  if (typeof window === 'undefined') return fallback;
  try {
    const key =
      channel === 'GOFOOD'
        ? STORAGE_KEYS.GOFOOD_PRESETS
        : STORAGE_KEYS.GRABFOOD_PRESETS;
    const raw = localStorage.getItem(key);
    if (!raw) {
      savePresets(channel, fallback);
      return fallback;
    }
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load presets from localStorage:', e);
    return fallback;
  }
}

export function savePresets(channel: WorkspaceChannel, presets: GlobalPresets): void {
  if (typeof window === 'undefined') return;
  try {
    const key =
      channel === 'GOFOOD'
        ? STORAGE_KEYS.GOFOOD_PRESETS
        : STORAGE_KEYS.GRABFOOD_PRESETS;
    localStorage.setItem(key, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets to localStorage:', e);
  }
}

export function resetWorkspaceToDefaults(channel: WorkspaceChannel): {
  items: MenuItem[];
  presets: GlobalPresets;
  categories: string[];
} {
  const items =
    channel === 'GOFOOD' ? [...INITIAL_GOFOOD_MENU_ITEMS] : [...INITIAL_GRAB_MENU_ITEMS];
  const presets =
    channel === 'GOFOOD' ? { ...DEFAULT_GOFOOD_PRESETS } : { ...DEFAULT_GRAB_PRESETS };
  const categories =
    channel === 'GOFOOD' ? [...DEFAULT_GOFOOD_CATEGORIES] : [...DEFAULT_GRAB_CATEGORIES];

  saveMenuItems(channel, items);
  savePresets(channel, presets);
  saveCategories(channel, categories);

  return { items, presets, categories };
}
