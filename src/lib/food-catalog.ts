import { MenuItem } from '@/types/pricing';

export interface FoodSuggestion {
  name: string;
  category: string;
  suggestedOfflinePrice: number;
  source: 'existing' | 'catalog';
}

export const INDONESIAN_FOOD_CATALOG: Omit<FoodSuggestion, 'source'>[] = [
  // 1. Paket Nasi & Makanan Utama
  { name: 'Nasi Rames Komplit', category: 'Paket Nasi', suggestedOfflinePrice: 25000 },
  { name: 'Nasi Rames Daging Empal', category: 'Paket Nasi', suggestedOfflinePrice: 28000 },
  { name: 'Nasi Rames Ayam Goreng', category: 'Paket Nasi', suggestedOfflinePrice: 30000 },
  { name: 'Nasi Rames Lauk Paru', category: 'Paket Nasi', suggestedOfflinePrice: 31000 },
  { name: 'Nasi Rames Tahu Tempe', category: 'Paket Nasi', suggestedOfflinePrice: 24000 },
  { name: 'Nasi Rames Telur Rebus', category: 'Paket Nasi', suggestedOfflinePrice: 24000 },
  { name: 'Nasi Pecel Daging Empal', category: 'Paket Nasi', suggestedOfflinePrice: 28000 },
  { name: 'Nasi Pecel Ayam Goreng', category: 'Paket Nasi', suggestedOfflinePrice: 30000 },
  { name: 'Nasi Pecel Lauk Paru', category: 'Paket Nasi', suggestedOfflinePrice: 31000 },
  { name: 'Nasi Pecel Tahu Tempe', category: 'Paket Nasi', suggestedOfflinePrice: 24000 },
  { name: 'Nasi Pecel Telur Rebus', category: 'Paket Nasi', suggestedOfflinePrice: 24000 },
  { name: 'Pecel Sayur', category: 'Paket Nasi', suggestedOfflinePrice: 21000 },
  { name: 'Lontong Pecel', category: 'Paket Nasi', suggestedOfflinePrice: 21000 },

  // 2. Olahan Ayam & Bebek (Menu Spesial / Makanan Utama)
  { name: 'Ayam Goreng Lengkuas', category: 'Menu Spesial', suggestedOfflinePrice: 28000 },
  { name: 'Ayam Bakar Madu', category: 'Menu Spesial', suggestedOfflinePrice: 30000 },
  { name: 'Ayam Geprek Sambal Bawang', category: 'Menu Spesial', suggestedOfflinePrice: 25000 },
  { name: 'Ayam Geprek Keju Mozarella', category: 'Menu Spesial', suggestedOfflinePrice: 30000 },
  { name: 'Ayam Penyet Sambal Ijo', category: 'Menu Spesial', suggestedOfflinePrice: 26000 },
  { name: 'Ayam Crispy Saus Keju', category: 'Menu Spesial', suggestedOfflinePrice: 27000 },
  { name: 'Bebek Goreng Kremes Sambal Korek', category: 'Menu Spesial', suggestedOfflinePrice: 42000 },
  { name: 'Bebek Bakar Bumbu Madura', category: 'Menu Spesial', suggestedOfflinePrice: 45000 },
  { name: 'Bebek Sinjay Sambal Pencit', category: 'Menu Spesial', suggestedOfflinePrice: 43000 },

  // 3. Olahan Daging, Mie & Kuah
  { name: 'Rendang Daging Sapi', category: 'Menu Spesial', suggestedOfflinePrice: 35000 },
  { name: 'Lontong Sayur Lengkap', category: 'Menu Spesial', suggestedOfflinePrice: 30000 },
  { name: 'Lontong Sayur Telur Rebus aja', category: 'Menu Spesial', suggestedOfflinePrice: 24000 },
  { name: 'Lontong Sayur Daging Empal aja', category: 'Menu Spesial', suggestedOfflinePrice: 26500 },
  { name: 'Lontong Sayur Lauk Paru', category: 'Menu Spesial', suggestedOfflinePrice: 34000 },
  { name: 'Lontong Sayur Ayam Goreng', category: 'Menu Spesial', suggestedOfflinePrice: 32000 },
  { name: 'Mie Ciplak Goreng', category: 'Menu Spesial', suggestedOfflinePrice: 28000 },
  { name: 'Mie Ciplak Rebus', category: 'Menu Spesial', suggestedOfflinePrice: 26000 },

  // 4. Minuman Segar & Kopi
  { name: 'Es Teh Manis Jumbo', category: 'Minuman', suggestedOfflinePrice: 6000 },
  { name: 'Es Teh Tawar Jumbo', category: 'Minuman', suggestedOfflinePrice: 4000 },
  { name: 'Es Jeruk Peras Segar', category: 'Minuman', suggestedOfflinePrice: 10000 },
  { name: 'Es Lemon Tea Segar', category: 'Minuman', suggestedOfflinePrice: 12000 },
  { name: 'Es Campur Spesial', category: 'Minuman', suggestedOfflinePrice: 18000 },
  { name: 'Es Teler Durian', category: 'Minuman', suggestedOfflinePrice: 22000 },
  { name: 'Es Cendol Dawet Nangka', category: 'Minuman', suggestedOfflinePrice: 15000 },
  { name: 'Jus Alpukat Kocok', category: 'Minuman', suggestedOfflinePrice: 18000 },
  { name: 'Jus Mangga Manis', category: 'Minuman', suggestedOfflinePrice: 16000 },
  { name: 'Jus Jeruk Murni', category: 'Minuman', suggestedOfflinePrice: 15000 },
  { name: 'Jus Buah Naga', category: 'Minuman', suggestedOfflinePrice: 16000 },
  { name: 'Kopi Susu Gula Aren', category: 'Minuman', suggestedOfflinePrice: 18000 },
  { name: 'Kopi Hitam Tubruk', category: 'Minuman', suggestedOfflinePrice: 10000 },
  { name: 'Americano Dingin', category: 'Minuman', suggestedOfflinePrice: 18000 },
  { name: 'Matcha Latte Dingin', category: 'Minuman', suggestedOfflinePrice: 22000 },
  { name: 'Air Mineral Botol 600ml', category: 'Minuman', suggestedOfflinePrice: 5000 },
  { name: 'Teh Pucuk Harum Dingin', category: 'Minuman', suggestedOfflinePrice: 6000 },
  { name: 'Teh Tarik Dingin', category: 'Minuman', suggestedOfflinePrice: 12000 },

  // 5. Camilan / Snack
  { name: 'Pisang Goreng Keju Cokelat', category: 'Camilan / Snack', suggestedOfflinePrice: 18000 },
  { name: 'Pisang Bakar Cokelat Keju', category: 'Camilan / Snack', suggestedOfflinePrice: 20000 },
  { name: 'Tahu Crispy Gurih', category: 'Camilan / Snack', suggestedOfflinePrice: 14000 },
  { name: 'Tempe Mendoan (4 pcs)', category: 'Camilan / Snack', suggestedOfflinePrice: 15000 },
  { name: 'Kentang Goreng (French Fries)', category: 'Camilan / Snack', suggestedOfflinePrice: 18000 },
  { name: 'Cireng Krispi Bumbu Rujak', category: 'Camilan / Snack', suggestedOfflinePrice: 16000 },
  { name: 'Roti Bakar Bandung Komplit', category: 'Camilan / Snack', suggestedOfflinePrice: 22000 },
  { name: 'Dimsum Ayam Kukus (4 pcs)', category: 'Camilan / Snack', suggestedOfflinePrice: 20000 },
  { name: 'Siomay Ikan Bandung (5 pcs)', category: 'Camilan / Snack', suggestedOfflinePrice: 25000 },
];

/**
 * Maps a generic category to the closest available category in the user's current list.
 */
export function mapToAvailableCategory(
  preferredCategory: string,
  availableCategories: string[] = []
): string {
  if (!availableCategories || availableCategories.length === 0) {
    return preferredCategory;
  }

  // Exact match
  const exact = availableCategories.find(
    (c) => c.toLowerCase() === preferredCategory.toLowerCase()
  );
  if (exact) return exact;

  // Substring match
  const sub = availableCategories.find(
    (c) =>
      c.toLowerCase().includes(preferredCategory.toLowerCase()) ||
      preferredCategory.toLowerCase().includes(c.toLowerCase())
  );
  if (sub) return sub;

  // Specific semantic fallbacks
  const lowerPref = preferredCategory.toLowerCase();
  if (lowerPref.includes('nasi') || lowerPref.includes('makan')) {
    const riceOrFood = availableCategories.find(
      (c) =>
        c.toLowerCase().includes('nasi') ||
        c.toLowerCase().includes('utama') ||
        c.toLowerCase().includes('makanan')
    );
    if (riceOrFood) return riceOrFood;
  }

  if (lowerPref.includes('minum')) {
    const drink = availableCategories.find((c) => c.toLowerCase().includes('minum'));
    if (drink) return drink;
  }

  if (lowerPref.includes('snack') || lowerPref.includes('camilan')) {
    const snack = availableCategories.find(
      (c) => c.toLowerCase().includes('snack') || c.toLowerCase().includes('camilan')
    );
    if (snack) return snack;
  }

  return availableCategories[0] || preferredCategory;
}

/**
 * Intelligently infers category based on keywords in menu name.
 */
export function inferCategoryFromMenuName(
  menuName: string,
  availableCategories: string[] = []
): string | null {
  const q = menuName.trim().toLowerCase();
  if (!q) return null;

  // 1. Check if name directly matches any known catalog item
  const foundInCatalog = INDONESIAN_FOOD_CATALOG.find((item) =>
    item.name.toLowerCase().includes(q) || q.includes(item.name.toLowerCase())
  );
  if (foundInCatalog) {
    return mapToAvailableCategory(foundInCatalog.category, availableCategories);
  }

  // 2. Keyword rules for Rice / Meals
  const nasiKeywords = [
    'nasi',
    'rames',
    'pecel',
    'uduk',
    'kuning',
    'liwet',
    'goreng ayam',
    'nasi bakar',
    'rice',
  ];
  if (nasiKeywords.some((kw) => q.includes(kw))) {
    return mapToAvailableCategory('Paket Nasi', availableCategories);
  }

  // 3. Keyword rules for Drinks
  const drinkKeywords = [
    'es ',
    'ice',
    'teh',
    'tea',
    'kopi',
    'coffee',
    'jus',
    'juice',
    'jeruk',
    'lemon',
    'cendol',
    'teler',
    'dawet',
    'latte',
    'matcha',
    'susu',
    'mineral',
    'boba',
    'smoothie',
    'air ',
  ];
  if (drinkKeywords.some((kw) => q.includes(kw))) {
    return mapToAvailableCategory('Minuman', availableCategories);
  }

  // 4. Keyword rules for Snacks
  const snackKeywords = [
    'pisang',
    'tahu',
    'tempe',
    'kentang',
    'cireng',
    'roti',
    'dimsum',
    'siomay',
    'snack',
    'camilan',
    'mendoan',
    'gorengan',
    'keripik',
    'bakwan',
    'risol',
    'pastel',
  ];
  if (snackKeywords.some((kw) => q.includes(kw))) {
    return mapToAvailableCategory('Camilan / Snack', availableCategories);
  }

  // 5. Keyword rules for Main Dish / Specials
  const dishKeywords = [
    'ayam',
    'bebek',
    'daging',
    'sapi',
    'kambing',
    'soto',
    'rawon',
    'sate',
    'gulai',
    'rendang',
    'geprek',
    'penyet',
    'bakar',
    'goreng',
    'mie',
    'kwetiau',
    'bihun',
    'bakso',
    'sop',
    'sup',
    'ikan',
    'lele',
    'gurame',
    'nila',
    'udang',
    'cumi',
  ];
  if (dishKeywords.some((kw) => q.includes(kw))) {
    return mapToAvailableCategory('Menu Spesial', availableCategories);
  }

  return null;
}

/**
 * Searches food suggestions combining existing workspace items and built-in catalog.
 */
export function getFoodSuggestions(
  query: string,
  existingItems: MenuItem[] = [],
  availableCategories: string[] = [],
  maxResults: number = 6
): FoodSuggestion[] {
  const q = query.trim().toLowerCase();
  const results: FoodSuggestion[] = [];
  const seenNames = new Set<string>();

  // 1. Search existing items in workspace first
  existingItems.forEach((item) => {
    const lowerName = item.name.toLowerCase();
    if (!q || lowerName.includes(q)) {
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        results.push({
          name: item.name,
          category: item.category,
          suggestedOfflinePrice: item.targetOfflinePrice,
          source: 'existing',
        });
      }
    }
  });

  // 2. Search built-in catalog
  INDONESIAN_FOOD_CATALOG.forEach((item) => {
    const lowerName = item.name.toLowerCase();
    if (!q || lowerName.includes(q)) {
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        results.push({
          name: item.name,
          category: mapToAvailableCategory(item.category, availableCategories),
          suggestedOfflinePrice: item.suggestedOfflinePrice,
          source: 'catalog',
        });
      }
    }
  });

  return results.slice(0, maxResults);
}
