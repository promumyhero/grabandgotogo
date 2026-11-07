'use client';

import React, { useState, useEffect } from 'react';
import { MenuItem, RoundingRule } from '@/types/pricing';
import {
  calculateForward,
  calculateRecommendedPrice,
  formatRupiah,
} from '@/lib/pricing-engine';
import {
  X,
  Copy,
  Check,
  ArrowUpRight,
} from 'lucide-react';

interface GoFoodReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: MenuItem | null;
  roundingRule?: RoundingRule;
  onApplyIdealPrice?: (itemId: string, newPrice: number) => void;
}

export function GoFoodReceiptModal({
  isOpen,
  onClose,
  selectedItem,
  roundingRule = 'CEIL_500',
  onApplyIdealPrice,
}: GoFoodReceiptModalProps) {
  const [interactiveSubsidy, setInteractiveSubsidy] = useState<number>(
    (selectedItem?.isCoFundedPromo ?? true)
      ? (selectedItem?.gojekSubsidyPct ?? 25)
      : 0
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeItem: MenuItem = selectedItem ?? {
    id: 'gofood-order-f3388856614',
    name: 'Paket Hemat Resto (Order F-3388856614)',
    category: 'GoFood Best Seller',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const isOrderF3388856614 =
    !selectedItem ||
    selectedItem.id === 'go-order-f3388856614' ||
    selectedItem.id === 'gofood-order-f3388856614';
  const isOrderF3392285639 = selectedItem?.id === 'go-order-f3392285639';

  const orderNumber = isOrderF3388856614
    ? 'F-3388856614'
    : isOrderF3392285639
    ? 'F-3392285639'
    : activeItem.name;

  const orderTimestamp = isOrderF3388856614
    ? '12:27, 12 Okt'
    : isOrderF3392285639
    ? '14:02, 18 Okt'
    : 'Simulasi';

  const subsidyPct = interactiveSubsidy;
  const isCoFunded = subsidyPct > 0;
  const commissionPct = activeItem.platformCommissionPct;

  const forwardResult = calculateForward(
    activeItem.displayPrice,
    activeItem.targetOfflinePrice,
    activeItem.merchantDiscountType,
    activeItem.merchantDiscountValue,
    commissionPct,
    0,
    false,
    'GOFOOD',
    subsidyPct,
    isCoFunded
  );

  const displayPenjualan = activeItem.displayPrice;
  const displayBiayaLayanan = forwardResult.platformFee;
  const displayBiayaMitra = forwardResult.mitraPromoShare ?? 0;
  const displayTotalDiskon = forwardResult.discountAmount;
  const displaySubsidiGojek = forwardResult.gojekPromoShare ?? 0;
  const displayNetPayout = forwardResult.netPayout;
  const displayVariance = forwardResult.variance;

  const recommendation = calculateRecommendedPrice(
    activeItem.targetOfflinePrice,
    activeItem.merchantDiscountType,
    activeItem.merchantDiscountValue,
    commissionPct,
    0,
    false,
    roundingRule,
    'GOFOOD',
    subsidyPct,
    isCoFunded
  );

  const WORST_CASE_LEVELS = [10, 20, 30, 40, 50];
  const worstCaseRows = WORST_CASE_LEVELS.map((pct) => {
    const sim = calculateForward(
      activeItem.displayPrice,
      activeItem.targetOfflinePrice,
      'PERCENT',
      pct,
      commissionPct,
      0,
      false,
      'GOFOOD',
      subsidyPct,
      isCoFunded
    );
    return { pct, mitra: sim.mitraPromoShare ?? 0, net: sim.netPayout, variance: sim.variance };
  });

  const worstCaseRecommendation = calculateRecommendedPrice(
    activeItem.targetOfflinePrice,
    'PERCENT',
    50,
    commissionPct,
    0,
    false,
    roundingRule,
    'GOFOOD',
    subsidyPct,
    isCoFunded
  );

  const handleCopySummary = () => {
    const text = `Rincian Transaksi GoFood${orderNumber.startsWith('F-') ? ` Order ${orderNumber}` : ''} (${activeItem.name})
- Penjualan: ${formatRupiah(displayPenjualan)}
- Biaya layanan GoFood Delivery (${commissionPct}% x (Penjualan - Promo mitra) + Rp 800): -${formatRupiah(displayBiayaLayanan)}
- Promo (Ditanggung mitra usaha): -${formatRupiah(displayBiayaMitra)}
- Total pendapatan bersih: ${formatRupiah(displayNetPayout)}
- Target Offline: ${formatRupiah(activeItem.targetOfflinePrice)}
- Selisih vs Target: ${formatRupiah(displayVariance, true)} (${displayVariance < 0 ? 'Defisit' : 'Surplus'})
- Rekomendasi Harga Ideal: ${formatRupiah(recommendation.roundedRecommendedPrice)}
- Harga Aman jika Diskon s.d. 50%: ${formatRupiah(worstCaseRecommendation.roundedRecommendedPrice)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBoncos = displayVariance < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gofood-receipt-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-modal-panel"
      >
        {/* Minimalist Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#EE2737]" />
              <span>GoBiz Settlement</span>
              <span>·</span>
              <span className="font-mono">{orderNumber}</span>
              <span>·</span>
              <span>{orderTimestamp}</span>
            </div>
            <h2 id="gofood-receipt-title" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Detail Transaksi GoFood
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Interactive Subsidy Switcher */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">Simulasi Subsidi Gojek</span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-md">
              {[
                { val: 0, label: '0%' },
                { val: 25, label: '25%' },
                { val: 30, label: '30%' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setInteractiveSubsidy(opt.val)}
                  className={`px-2.5 py-0.5 rounded font-semibold transition-colors cursor-pointer tabular-nums ${
                    subsidyPct === opt.val
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Perhitungan */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-900">Rincian Pendapatan & Potongan</div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Penjualan ({activeItem.name})</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatRupiah(displayPenjualan)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-600 block">
                  Biaya layanan GoFood Delivery
                </span>
                <span className="text-slate-400 block text-[10px] tabular-nums">
                  {commissionPct}% × ({formatRupiah(displayPenjualan)} − {formatRupiah(displayBiayaMitra)}) + Rp 800
                </span>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums">
                -{formatRupiah(displayBiayaLayanan)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-600 block">
                  Promo ditanggung mitra ({100 - subsidyPct}%)
                </span>
                <span className="text-slate-400 block text-[10px] tabular-nums">
                  Total diskon konsumen {formatRupiah(displayTotalDiskon)} (Subsidi Gojek {formatRupiah(displaySubsidiGojek)})
                </span>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums">
                -{formatRupiah(displayBiayaMitra)}
              </span>
            </div>
          </div>

          {/* Section 2: Total Pendapatan Bersih */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Pendapatan Bersih</span>
              <span className="font-mono text-slate-300 text-[11px]">GoBiz Settlement</span>
            </div>

            <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
              {formatRupiah(displayNetPayout)}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Offline ({formatRupiah(activeItem.targetOfflinePrice)})</span>
              <span
                className={`font-semibold tabular-nums ${
                  isBoncos ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatRupiah(displayVariance, true)} ({isBoncos ? 'Defisit' : 'Surplus'})
              </span>
            </div>
          </div>

          {/* Section 3: Recommended Price */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block">
                Rekomendasi Harga Minimum (Diskon Saat Ini)
              </span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {formatRupiah(recommendation.roundedRecommendedPrice)}
              </span>
            </div>

            {onApplyIdealPrice && (
              <button
                type="button"
                onClick={() => {
                  onApplyIdealPrice(activeItem.id, recommendation.roundedRecommendedPrice);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <span>Terapkan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Section 4: Worst-case simulation for Maksimal PRO dynamic discount (10% - 50%) */}
          <div className="rounded-lg border border-slate-200/90 overflow-hidden text-xs">
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80">
              <div className="font-semibold text-slate-800">
                Simulasi Rentang Diskon Maksimal PRO (10% – 50%)
              </div>
              <div className="text-[11px] text-slate-500">
                Payout pada harga {formatRupiah(displayPenjualan)} untuk berbagai tingkat voucher dinamis:
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50/40">
                  <th className="px-3.5 py-1.5 text-left font-medium">Diskon</th>
                  <th className="px-3.5 py-1.5 text-right font-medium">Beban Mitra</th>
                  <th className="px-3.5 py-1.5 text-right font-medium">Payout</th>
                  <th className="px-3.5 py-1.5 text-right font-medium">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {worstCaseRows.map((row) => (
                  <tr key={`wc-${row.pct}`}>
                    <td className="px-3.5 py-1.5 font-medium text-slate-700 tabular-nums">{row.pct}%</td>
                    <td className="px-3.5 py-1.5 text-right tabular-nums text-slate-600">
                      -{formatRupiah(row.mitra)}
                    </td>
                    <td className="px-3.5 py-1.5 text-right tabular-nums font-semibold text-slate-900">
                      {formatRupiah(row.net)}
                    </td>
                    <td
                      className={`px-3.5 py-1.5 text-right tabular-nums font-semibold ${
                        row.variance < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatRupiah(row.variance, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Harga aman bila terkena diskon puncak 50%
                </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(worstCaseRecommendation.roundedRecommendedPrice)}
                </span>
              </div>
              {onApplyIdealPrice && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyIdealPrice(
                      activeItem.id,
                      worstCaseRecommendation.roundedRecommendedPrice
                    );
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  <span>Pakai Harga Aman</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? 'Tersalin' : 'Salin Rincian'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
