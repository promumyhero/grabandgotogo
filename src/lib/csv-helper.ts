import { CalculationResult, MenuItem, WorkspaceChannel } from '@/types/pricing';

export function exportPricingToCsv(
  items: MenuItem[],
  calculations: Map<string, CalculationResult>,
  channel: WorkspaceChannel
) {
  const headers = [
    'ID Menu',
    'Nama Menu',
    'Kategori',
    'Platform Delivery',
    'Target Payout Offline (Rp)',
    'Harga Jual di Aplikasi (Rp)',
    'Tipe Diskon Mitra',
    'Nilai Diskon Mitra',
    'Potongan Diskon Rupiah (Rp)',
    'Komisi Layanan (%)',
    'PUAS Booster (%)',
    'Booster Aktif',
    'Total Potongan Platform (Rp)',
    'Net Payout Diterima Mitra (Rp)',
    'Selisih vs Target (Rp)',
    'Status Margin',
    'Harga Rekomendasi Ideal (Rp)',
    'Rekomendasi Payout (Rp)',
  ];

  const rows = items.map((item) => {
    const calc = calculations.get(item.id);
    const isBoncos = calc ? calc.variance < 0 : false;

    return [
      `"${item.id}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${item.channel}"`,
      item.targetOfflinePrice,
      item.displayPrice,
      `"${item.merchantDiscountType}"`,
      item.merchantDiscountValue,
      calc ? calc.discountAmount : 0,
      item.platformCommissionPct,
      item.marketingBoosterPct,
      item.isBoosterActive ? 'YA' : 'TIDAK',
      calc ? calc.totalPlatformDeduction : 0,
      calc ? calc.netPayout : 0,
      calc ? calc.variance : 0,
      isBoncos ? 'BONCOS' : 'AMAN',
      calc ? calc.recommendedDisplayPriceRounded : 0,
      calc ? calc.recommendedNetPayout : 0,
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
