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
  merchantDiscountValue: 20,
  merchantDiscountType: 'PERCENT',
  roundingRule: 'CEIL_500',
  isBoosterActiveDefault: false,
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
    id: 'go-item-1',
    name: 'Nasi Pecel Ayam Goreng (GoFood)',
    category: 'Paket Nasi',
    channel: 'GOFOOD',
    targetOfflinePrice: 30000,
    displayPrice: 48000,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 20,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    notes: 'Standar GoFood Komisi 20%',
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
    merchantDiscountValue: 20,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    notes: 'Menu Best Seller GoFood',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'go-item-3',
    name: 'Es Teh Manis Jumbo (GoFood)',
    category: 'Minuman',
    channel: 'GOFOOD',
    targetOfflinePrice: 15000,
    displayPrice: 22000,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 15,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    notes: 'Minuman Segar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  GRABFOOD_ITEMS: 'fmp_grabfood_items_v2',
  GOFOOD_ITEMS: 'fmp_gofood_items_v2',
  GRABFOOD_PRESETS: 'fmp_grabfood_presets_v2',
  GOFOOD_PRESETS: 'fmp_gofood_presets_v2',
  ACTIVE_CHANNEL: 'fmp_active_channel_v2',
};

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
} {
  const items =
    channel === 'GOFOOD' ? [...INITIAL_GOFOOD_MENU_ITEMS] : [...INITIAL_GRAB_MENU_ITEMS];
  const presets =
    channel === 'GOFOOD' ? { ...DEFAULT_GOFOOD_PRESETS } : { ...DEFAULT_GRAB_PRESETS };

  saveMenuItems(channel, items);
  savePresets(channel, presets);

  return { items, presets };
}
