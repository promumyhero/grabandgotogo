import {
  CalculationResult,
  DiscountType,
  GlobalPresets,
  MenuItem,
  WorkspaceChannel,
} from '@/types/pricing';

export function exportPricingToCsv(
  items: MenuItem[],
  calculations: Map<string, CalculationResult>,
  channel: WorkspaceChannel
) {
  const isGrab = channel === 'GRABFOOD';

  const headers = [
    'ID Menu',
    'Nama Menu',
    'Kategori',
    'Platform Delivery',
    'Target Payout Offline (Rp)',
    'Harga Jual di Aplikasi (Rp)',
    'Harga Bayar Konsumen (Rp)',
    'Tipe Diskon',
    'Nilai Diskon',
    'Potongan Diskon Rupiah (Rp)',
    'Komisi Layanan (%)',
    isGrab ? 'PUAS Booster (%)' : 'Subsidi Gojek (%)',
    isGrab ? 'Booster Aktif' : 'Promo Co-Funding Aktif',
    'Total Potongan Platform (Rp)',
    'Net Payout Diterima Mitra (Rp)',
    'Selisih vs Target (Rp)',
    'Status Margin',
    'Harga Rekomendasi Ideal (Rp)',
    'Rekomendasi Payout (Rp)',
    'Catatan',
  ];

  const rows = items.map((item) => {
    const calc = calculations.get(item.id);
    const isBoncos = calc ? calc.variance < 0 : false;

    return [
      `"${item.id}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.category || 'Menu').replace(/"/g, '""')}"`,
      `"${channel}"`,
      item.targetOfflinePrice,
      item.displayPrice,
      calc ? calc.subtotalAfterDiscount : item.displayPrice,
      `"${item.merchantDiscountType}"`,
      item.merchantDiscountValue,
      calc ? calc.discountAmount : 0,
      item.platformCommissionPct,
      isGrab ? item.marketingBoosterPct : (item.gojekSubsidyPct ?? 25),
      isGrab
        ? item.isBoosterActive
          ? 'YA'
          : 'TIDAK'
        : (item.isCoFundedPromo ?? true)
        ? 'YA'
        : 'TIDAK',
      calc ? calc.totalPlatformDeduction : 0,
      calc ? calc.netPayout : 0,
      calc ? calc.variance : 0,
      isBoncos ? 'BONCOS' : 'AMAN',
      calc ? calc.recommendedDisplayPriceRounded : 0,
      calc ? calc.recommendedNetPayout : 0,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `foodmerchant-pricing-${channel.toLowerCase()}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse a single CSV line respecting quoted fields and escaped double quotes.
 */
function parseCsvRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function cleanNumber(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  // Remove currency symbols, spaces, thousand separators (dot if followed by 3 digits)
  const trimmed = val.replace(/[Rp\s]/gi, '').trim();
  if (!trimmed) return fallback;
  // Handle Indonesian thousand format e.g. "30.000" vs decimal "20.5"
  const normalized = /^\d{1,3}(\.\d{3})+$/.test(trimmed)
    ? trimmed.replace(/\./g, '')
    : trimmed.replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

export interface CsvImportResult {
  items: MenuItem[];
  discoveredCategories: string[];
  skippedCount: number;
}

/**
 * Parses CSV content (either exported from this app or a simple merchant menu CSV)
 * into valid MenuItem objects.
 */
export function parsePricingCsv(
  rawText: string,
  channel: WorkspaceChannel,
  presets: GlobalPresets
): CsvImportResult {
  const cleanedText = rawText.replace(/^\uFEFF/, '').trim();
  if (!cleanedText) {
    return { items: [], discoveredCategories: [], skippedCount: 0 };
  }

  const lines = cleanedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { items: [], discoveredCategories: [], skippedCount: 0 };
  }

  // Auto-detect delimiter (comma vs semicolon for Indonesian Excel)
  const headerLine = lines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const rawHeaders = parseCsvRow(headerLine, delimiter).map((h) =>
    h.replace(/^"|"$/g, '').toLowerCase().trim()
  );

  const findColIndex = (keywords: string[]) =>
    rawHeaders.findIndex((h) => keywords.some((kw) => h.includes(kw)));

  const nameIdx = findColIndex(['nama menu', 'nama', 'menu', 'name', 'item']);
  const categoryIdx = findColIndex(['kategori', 'category', 'jenis']);
  const targetIdx = findColIndex([
    'target payout',
    'target offline',
    'harga offline',
    'target',
    'offline',
    'modal',
  ]);
  const displayIdx = findColIndex([
    'harga jual',
    'display price',
    'harga aplikasi',
    'harga app',
    'harga online',
    'jual',
  ]);
  const discountTypeIdx = findColIndex(['tipe diskon', 'jenis diskon', 'discount type']);
  const discountValIdx = findColIndex(['nilai diskon', 'diskon mitra', 'promo konsumen', 'discount value']);
  const commIdx = findColIndex(['komisi', 'commission']);
  const boosterOrSubsidyIdx = findColIndex(['puas booster', 'subsidi gojek', 'booster', 'subsidi']);
  const activeFlagIdx = findColIndex(['booster aktif', 'co-funding aktif', 'aktif']);
  const notesIdx = findColIndex(['catatan', 'notes', 'keterangan']);

  // Fallback positional indices if simple 3-4 column CSV without standard headers
  const effectiveNameIdx = nameIdx >= 0 ? nameIdx : 0;
  const effectiveCategoryIdx = categoryIdx >= 0 ? categoryIdx : 1;
  const effectiveTargetIdx = targetIdx >= 0 ? targetIdx : 2;
  const effectiveDisplayIdx = displayIdx >= 0 ? displayIdx : 3;

  const importedItems: MenuItem[] = [];
  const discoveredCategoriesSet = new Set<string>();
  let skippedCount = 0;
  const nowIso = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i], delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    const name = cols[effectiveNameIdx]?.trim();

    if (!name) {
      skippedCount++;
      continue;
    }

    const category = cols[effectiveCategoryIdx]?.trim() || 'Paket Nasi';
    discoveredCategoriesSet.add(category);

    const targetOfflinePrice = cleanNumber(cols[effectiveTargetIdx], 25000);
    const displayPrice = cleanNumber(
      cols[effectiveDisplayIdx],
      targetOfflinePrice > 0 ? Math.ceil((targetOfflinePrice * 1.45) / 500) * 500 : 36500
    );

    let merchantDiscountType: DiscountType = presets.merchantDiscountType;
    if (discountTypeIdx >= 0 && cols[discountTypeIdx]) {
      const rawType = cols[discountTypeIdx].toUpperCase();
      if (rawType.includes('NOMINAL') || rawType.includes('RP')) {
        merchantDiscountType = 'NOMINAL';
      } else if (rawType.includes('PERCENT') || rawType.includes('%')) {
        merchantDiscountType = 'PERCENT';
      }
    }

    const merchantDiscountValue =
      discountValIdx >= 0
        ? cleanNumber(cols[discountValIdx], presets.merchantDiscountValue)
        : presets.merchantDiscountValue;

    const platformCommissionPct =
      commIdx >= 0
        ? Math.min(100, cleanNumber(cols[commIdx], presets.platformCommissionPct))
        : presets.platformCommissionPct;

    const boosterOrSubsidyVal =
      boosterOrSubsidyIdx >= 0
        ? Math.min(
            100,
            cleanNumber(
              cols[boosterOrSubsidyIdx],
              channel === 'GRABFOOD'
                ? presets.marketingBoosterPct
                : (presets.gojekSubsidyPct ?? 25)
            )
          )
        : channel === 'GRABFOOD'
        ? presets.marketingBoosterPct
        : (presets.gojekSubsidyPct ?? 25);

    let isActiveFlag =
      channel === 'GRABFOOD'
        ? presets.isBoosterActiveDefault
        : (presets.isCoFundedPromo ?? true);

    if (activeFlagIdx >= 0 && cols[activeFlagIdx]) {
      const rawActive = cols[activeFlagIdx].toUpperCase();
      if (['YA', 'YES', 'TRUE', '1', 'AKTIF', 'ON'].includes(rawActive)) {
        isActiveFlag = true;
      } else if (['TIDAK', 'NO', 'FALSE', '0', 'OFF', 'NONAKTIF'].includes(rawActive)) {
        isActiveFlag = false;
      }
    }

    const notes = notesIdx >= 0 && cols[notesIdx] ? cols[notesIdx] : undefined;

    importedItems.push({
      id: `${channel.toLowerCase()}-imp-${Date.now()}-${i}`,
      name,
      category,
      channel,
      targetOfflinePrice,
      displayPrice,
      merchantDiscountType,
      merchantDiscountValue,
      platformCommissionPct,
      marketingBoosterPct:
        channel === 'GRABFOOD' ? boosterOrSubsidyVal : presets.marketingBoosterPct,
      isBoosterActive: channel === 'GRABFOOD' ? isActiveFlag : false,
      gojekSubsidyPct:
        channel === 'GOFOOD' ? boosterOrSubsidyVal : (presets.gojekSubsidyPct ?? 25),
      isCoFundedPromo: channel === 'GOFOOD' ? isActiveFlag : true,
      notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return {
    items: importedItems,
    discoveredCategories: Array.from(discoveredCategoriesSet),
    skippedCount,
  };
}
