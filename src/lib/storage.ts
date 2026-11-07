import {
  DiscountTemplate,
  GlobalPresets,
  MenuItem,
  WorkspaceChannel,
} from '@/types/pricing';

export const DEMO_MAX_MENU_ITEMS = 5;

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

export const BUILT_IN_DISCOUNT_TEMPLATES: DiscountTemplate[] = [
  {
    id: 'builtin-grab-reguler-30',
    name: 'GrabFood Campaign 30% + Booster 14%',
    channel: 'GRABFOOD',
    platformCommissionPct: 20,
    marketingBoosterPct: 14,
    isBoosterActiveDefault: true,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 30,
    roundingRule: 'CEIL_500',
    isBuiltIn: true,
  },
  {
    id: 'builtin-grab-hemat-20',
    name: 'GrabFood Diskon 20% (Tanpa Booster)',
    channel: 'GRABFOOD',
    platformCommissionPct: 20,
    marketingBoosterPct: 14,
    isBoosterActiveDefault: false,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 20,
    roundingRule: 'CEIL_500',
    isBuiltIn: true,
  },
  {
    id: 'builtin-grab-normal-0',
    name: 'GrabFood Harga Normal (Komisi 20% Saja)',
    channel: 'GRABFOOD',
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActiveDefault: false,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 0,
    roundingRule: 'CEIL_500',
    isBuiltIn: true,
  },
  {
    id: 'builtin-gofood-maksimal-25',
    name: 'GoFood Maksimal PRO (Diskon 15% • Subsidi 25%)',
    channel: 'GOFOOD',
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActiveDefault: false,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 15,
    gojekSubsidyPct: 25,
    isCoFundedPromo: true,
    roundingRule: 'CEIL_500',
    isBuiltIn: true,
  },
  {
    id: 'builtin-gofood-mandiri-10',
    name: 'GoFood Promo Mandiri 10% (Tanpa Subsidi)',
    channel: 'GOFOOD',
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActiveDefault: false,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 10,
    gojekSubsidyPct: 0,
    isCoFundedPromo: false,
    roundingRule: 'CEIL_500',
    isBuiltIn: true,
  },
  {
    id: 'builtin-gofood-normal-0',
    name: 'GoFood Harga Normal (Komisi 20% + Rp 800)',
    channel: 'GOFOOD',
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActiveDefault: false,
    merchantDiscountType: 'PERCENT',
    merchantDiscountValue: 0,
    gojekSubsidyPct: 25,
    isCoFundedPromo: false,
    roundingRule: 'CEIL_500',
    isBuiltIn: true,
  },
];

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
    merchantDiscountValue: 4600,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25,
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
    merchantDiscountValue: 20160,
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25,
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

function getScopePrefix(merchantId?: string | null): string {
  if (!merchantId || !merchantId.trim()) return 'fmp_demo';
  const safeId = merchantId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  return `fmp_u_${safeId}`;
}

function getScopedKeys(merchantId?: string | null) {
  const prefix = getScopePrefix(merchantId);
  return {
    GRABFOOD_ITEMS: `${prefix}_grabfood_items_v2`,
    GOFOOD_ITEMS: `${prefix}_gofood_items_v3`,
    GRABFOOD_PRESETS: `${prefix}_grabfood_presets_v2`,
    GOFOOD_PRESETS: `${prefix}_gofood_presets_v3`,
    GRABFOOD_CATEGORIES: `${prefix}_grabfood_categories_v1`,
    GOFOOD_CATEGORIES: `${prefix}_gofood_categories_v1`,
    GRABFOOD_TEMPLATES: `${prefix}_grabfood_templates_v1`,
    GOFOOD_TEMPLATES: `${prefix}_gofood_templates_v1`,
    ACTIVE_CHANNEL: `${prefix}_active_channel_v2`,
  };
}

export function loadCategories(
  channel: WorkspaceChannel,
  merchantId?: string | null
): string[] {
  const fallback =
    channel === 'GOFOOD' ? DEFAULT_GOFOOD_CATEGORIES : DEFAULT_GRAB_CATEGORIES;
  if (typeof window === 'undefined') return fallback;
  try {
    const keys = getScopedKeys(merchantId);
    const key =
      channel === 'GOFOOD' ? keys.GOFOOD_CATEGORIES : keys.GRABFOOD_CATEGORIES;
    const raw = localStorage.getItem(key);
    if (!raw) {
      saveCategories(channel, fallback, merchantId);
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch (e) {
    console.error('Failed to load categories from localStorage:', e);
    return fallback;
  }
}

export function saveCategories(
  channel: WorkspaceChannel,
  categories: string[],
  merchantId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getScopedKeys(merchantId);
    const key =
      channel === 'GOFOOD' ? keys.GOFOOD_CATEGORIES : keys.GRABFOOD_CATEGORIES;
    localStorage.setItem(key, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories to localStorage:', e);
  }
}

export function getStoredActiveChannel(merchantId?: string | null): WorkspaceChannel {
  if (typeof window === 'undefined') return 'GRABFOOD';
  try {
    const keys = getScopedKeys(merchantId);
    const val = localStorage.getItem(keys.ACTIVE_CHANNEL);
    return val === 'GOFOOD' ? 'GOFOOD' : 'GRABFOOD';
  } catch {
    return 'GRABFOOD';
  }
}

export function setStoredActiveChannel(
  channel: WorkspaceChannel,
  merchantId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getScopedKeys(merchantId);
    localStorage.setItem(keys.ACTIVE_CHANNEL, channel);
  } catch {
    // ignore
  }
}

export function loadMenuItems(
  channel: WorkspaceChannel,
  merchantId?: string | null
): MenuItem[] {
  if (typeof window === 'undefined') {
    return channel === 'GOFOOD'
      ? INITIAL_GOFOOD_MENU_ITEMS
      : INITIAL_GRAB_MENU_ITEMS;
  }
  try {
    const keys = getScopedKeys(merchantId);
    const key = channel === 'GOFOOD' ? keys.GOFOOD_ITEMS : keys.GRABFOOD_ITEMS;
    const raw = localStorage.getItem(key);
    if (raw === null) {
      const initial =
        channel === 'GOFOOD'
          ? INITIAL_GOFOOD_MENU_ITEMS
          : INITIAL_GRAB_MENU_ITEMS;
      saveMenuItems(channel, initial, merchantId);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return channel === 'GOFOOD'
      ? INITIAL_GOFOOD_MENU_ITEMS
      : INITIAL_GRAB_MENU_ITEMS;
  } catch (e) {
    console.error('Failed to load menu items from localStorage:', e);
    return channel === 'GOFOOD'
      ? INITIAL_GOFOOD_MENU_ITEMS
      : INITIAL_GRAB_MENU_ITEMS;
  }
}

export function saveMenuItems(
  channel: WorkspaceChannel,
  items: MenuItem[],
  merchantId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getScopedKeys(merchantId);
    const key = channel === 'GOFOOD' ? keys.GOFOOD_ITEMS : keys.GRABFOOD_ITEMS;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save menu items to localStorage:', e);
  }
}

export function loadPresets(
  channel: WorkspaceChannel,
  merchantId?: string | null
): GlobalPresets {
  const fallback =
    channel === 'GOFOOD' ? DEFAULT_GOFOOD_PRESETS : DEFAULT_GRAB_PRESETS;
  if (typeof window === 'undefined') return fallback;
  try {
    const keys = getScopedKeys(merchantId);
    const key =
      channel === 'GOFOOD' ? keys.GOFOOD_PRESETS : keys.GRABFOOD_PRESETS;
    const raw = localStorage.getItem(key);
    if (!raw) {
      savePresets(channel, fallback, merchantId);
      return fallback;
    }
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load presets from localStorage:', e);
    return fallback;
  }
}

export function savePresets(
  channel: WorkspaceChannel,
  presets: GlobalPresets,
  merchantId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getScopedKeys(merchantId);
    const key =
      channel === 'GOFOOD' ? keys.GOFOOD_PRESETS : keys.GRABFOOD_PRESETS;
    localStorage.setItem(key, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets to localStorage:', e);
  }
}

export function loadDiscountTemplates(
  channel: WorkspaceChannel,
  merchantId?: string | null
): DiscountTemplate[] {
  const builtIn = BUILT_IN_DISCOUNT_TEMPLATES.filter((t) => t.channel === channel);
  if (typeof window === 'undefined') return builtIn;
  try {
    const keys = getScopedKeys(merchantId);
    const key =
      channel === 'GOFOOD' ? keys.GOFOOD_TEMPLATES : keys.GRABFOOD_TEMPLATES;
    const raw = localStorage.getItem(key);
    if (!raw) return builtIn;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return builtIn;
    const custom = parsed.filter(
      (t: DiscountTemplate) => t && !t.isBuiltIn && t.channel === channel
    );
    return [...builtIn, ...custom];
  } catch {
    return builtIn;
  }
}

export function saveDiscountTemplates(
  channel: WorkspaceChannel,
  templates: DiscountTemplate[],
  merchantId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getScopedKeys(merchantId);
    const key =
      channel === 'GOFOOD' ? keys.GOFOOD_TEMPLATES : keys.GRABFOOD_TEMPLATES;
    const customOnly = templates.filter((t) => !t.isBuiltIn);
    localStorage.setItem(key, JSON.stringify(customOnly));
  } catch (e) {
    console.error('Failed to save discount templates:', e);
  }
}

export function resetWorkspaceToDefaults(
  channel: WorkspaceChannel,
  merchantId?: string | null
): {
  items: MenuItem[];
  presets: GlobalPresets;
  categories: string[];
} {
  const items =
    channel === 'GOFOOD'
      ? [...INITIAL_GOFOOD_MENU_ITEMS]
      : [...INITIAL_GRAB_MENU_ITEMS];
  const presets =
    channel === 'GOFOOD'
      ? { ...DEFAULT_GOFOOD_PRESETS }
      : { ...DEFAULT_GRAB_PRESETS };
  const categories =
    channel === 'GOFOOD'
      ? [...DEFAULT_GOFOOD_CATEGORIES]
      : [...DEFAULT_GRAB_CATEGORIES];

  saveMenuItems(channel, items, merchantId);
  savePresets(channel, presets, merchantId);
  saveCategories(channel, categories, merchantId);

  return { items, presets, categories };
}

/**
 * Permanently remove all tenant-scoped localStorage keys for a deleted merchant account.
 */
export function clearMerchantStorage(merchantId: string): void {
  if (typeof window === 'undefined' || !merchantId) return;
  try {
    const keys = getScopedKeys(merchantId);
    Object.values(keys).forEach((k) => {
      localStorage.removeItem(k);
    });
  } catch (e) {
    console.error('Failed to clear merchant storage:', e);
  }
}

export interface FullRestoBackupPayload {
  version: number;
  exportedAt: string;
  restaurantName: string;
  grabfood: {
    items: MenuItem[];
    presets: GlobalPresets;
    categories: string[];
    customTemplates: DiscountTemplate[];
  };
  gofood: {
    items: MenuItem[];
    presets: GlobalPresets;
    categories: string[];
    customTemplates: DiscountTemplate[];
  };
}

export function createFullBackupObject(
  merchantId?: string | null,
  restaurantName: string = 'Restoran Saya'
): FullRestoBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    restaurantName,
    grabfood: {
      items: loadMenuItems('GRABFOOD', merchantId),
      presets: loadPresets('GRABFOOD', merchantId),
      categories: loadCategories('GRABFOOD', merchantId),
      customTemplates: loadDiscountTemplates('GRABFOOD', merchantId).filter(
        (t) => !t.isBuiltIn
      ),
    },
    gofood: {
      items: loadMenuItems('GOFOOD', merchantId),
      presets: loadPresets('GOFOOD', merchantId),
      categories: loadCategories('GOFOOD', merchantId),
      customTemplates: loadDiscountTemplates('GOFOOD', merchantId).filter(
        (t) => !t.isBuiltIn
      ),
    },
  };
}

function sanitizeBackupText(val: unknown, maxLen = 180): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function clampBackupNum(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeBackupChannelData(
  rawChannel: Partial<FullRestoBackupPayload['grabfood']> | undefined,
  channel: WorkspaceChannel,
  merchantId?: string | null
) {
  if (!rawChannel || typeof rawChannel !== 'object') return;
  const fallbackPresets =
    channel === 'GOFOOD' ? DEFAULT_GOFOOD_PRESETS : DEFAULT_GRAB_PRESETS;

  if (Array.isArray(rawChannel.items)) {
    const cleanItems: MenuItem[] = rawChannel.items
      .slice(0, 500)
      .filter((it) => it && typeof it === 'object' && sanitizeBackupText(it.name, 200))
      .map((it, idx) => {
        const subsidy = clampBackupNum(
          it.gojekSubsidyPct,
          0,
          100,
          fallbackPresets.gojekSubsidyPct ?? 25
        );
        const coFunded =
          it.isCoFundedPromo !== undefined
            ? Boolean(it.isCoFundedPromo)
            : subsidy > 0;
        return {
          id: sanitizeBackupText(it.id, 80) || `${channel.toLowerCase()}-restored-${Date.now()}-${idx}`,
          name: sanitizeBackupText(it.name, 200),
          category: sanitizeBackupText(it.category, 80) || 'Paket Nasi',
          channel,
          targetOfflinePrice: Math.round(clampBackupNum(it.targetOfflinePrice, 0, 100_000_000, 0)),
          displayPrice: Math.round(clampBackupNum(it.displayPrice, 0, 100_000_000, 0)),
          merchantDiscountType: it.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT',
          merchantDiscountValue: clampBackupNum(it.merchantDiscountValue, 0, 100_000_000, 0),
          platformCommissionPct: clampBackupNum(
            it.platformCommissionPct,
            0,
            100,
            fallbackPresets.platformCommissionPct
          ),
          marketingBoosterPct: clampBackupNum(
            it.marketingBoosterPct,
            0,
            100,
            fallbackPresets.marketingBoosterPct
          ),
          isBoosterActive: Boolean(it.isBoosterActive),
          gojekSubsidyPct: coFunded ? subsidy : 0,
          isCoFundedPromo: coFunded,
          notes: sanitizeBackupText(it.notes, 300) || undefined,
          createdAt: typeof it.createdAt === 'string' ? it.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    saveMenuItems(channel, cleanItems, merchantId);
  }

  if (rawChannel.presets && typeof rawChannel.presets === 'object') {
    const p = rawChannel.presets;
    const validRounding = ['EXACT', 'CEIL_100', 'CEIL_500', 'CEIL_1000'].includes(
      p.roundingRule
    )
      ? p.roundingRule
      : fallbackPresets.roundingRule;
    const subsidy = clampBackupNum(
      p.gojekSubsidyPct,
      0,
      100,
      fallbackPresets.gojekSubsidyPct ?? 25
    );
    const coFunded =
      p.isCoFundedPromo !== undefined ? Boolean(p.isCoFundedPromo) : subsidy > 0;

    savePresets(
      channel,
      {
        platformCommissionPct: clampBackupNum(
          p.platformCommissionPct,
          0,
          100,
          fallbackPresets.platformCommissionPct
        ),
        marketingBoosterPct: clampBackupNum(
          p.marketingBoosterPct,
          0,
          100,
          fallbackPresets.marketingBoosterPct
        ),
        merchantDiscountValue: clampBackupNum(
          p.merchantDiscountValue,
          0,
          100_000_000,
          fallbackPresets.merchantDiscountValue
        ),
        merchantDiscountType:
          p.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT',
        roundingRule: validRounding,
        isBoosterActiveDefault: Boolean(
          p.isBoosterActiveDefault ?? fallbackPresets.isBoosterActiveDefault
        ),
        gojekSubsidyPct: coFunded ? subsidy : 0,
        isCoFundedPromo: coFunded,
      },
      merchantId
    );
  }

  if (Array.isArray(rawChannel.categories)) {
    const cleanCategories = Array.from(
      new Set(
        rawChannel.categories
          .map((c) => sanitizeBackupText(c, 80))
          .filter(Boolean)
          .slice(0, 50)
      )
    );
    if (cleanCategories.length > 0) {
      saveCategories(channel, cleanCategories, merchantId);
    }
  }

  if (Array.isArray(rawChannel.customTemplates)) {
    const cleanTemplates: DiscountTemplate[] = rawChannel.customTemplates
      .slice(0, 30)
      .filter((t) => t && typeof t === 'object' && !t.isBuiltIn && sanitizeBackupText(t.name, 80))
      .map((t, idx) => ({
        id: sanitizeBackupText(t.id, 80) || `tpl-${Date.now()}-${idx}`,
        name: sanitizeBackupText(t.name, 80),
        channel,
        platformCommissionPct: clampBackupNum(t.platformCommissionPct, 0, 100, 20),
        marketingBoosterPct: clampBackupNum(t.marketingBoosterPct, 0, 100, 0),
        isBoosterActiveDefault: Boolean(t.isBoosterActiveDefault),
        merchantDiscountType:
          t.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT',
        merchantDiscountValue: clampBackupNum(t.merchantDiscountValue, 0, 100_000_000, 0),
        gojekSubsidyPct: clampBackupNum(t.gojekSubsidyPct, 0, 100, 25),
        isCoFundedPromo: Boolean(t.isCoFundedPromo ?? true),
        roundingRule: ['EXACT', 'CEIL_100', 'CEIL_500', 'CEIL_1000'].includes(
          t.roundingRule
        )
          ? t.roundingRule
          : 'CEIL_500',
        isBuiltIn: false,
      }));
    saveDiscountTemplates(channel, cleanTemplates, merchantId);
  }
}

export function restoreFullBackupObject(
  rawJson: string,
  merchantId?: string | null
): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(rawJson) as Partial<FullRestoBackupPayload>;
    if (!parsed || typeof parsed !== 'object' || !parsed.grabfood || !parsed.gofood) {
      return {
        success: false,
        error: 'Format file backup JSON tidak valid.',
      };
    }

    sanitizeBackupChannelData(parsed.grabfood, 'GRABFOOD', merchantId);
    sanitizeBackupChannelData(parsed.gofood, 'GOFOOD', merchantId);

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Gagal membaca file backup JSON. Pastikan file tidak rusak.',
    };
  }
}
