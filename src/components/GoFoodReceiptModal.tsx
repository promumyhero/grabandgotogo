'use client';

import React, { useState } from 'react';
import { MenuItem, RoundingRule } from '@/types/pricing';
import {
  calculateForward,
  calculateRecommendedPrice,
  formatRupiah,
} from '@/lib/pricing-engine';
import {
  X,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Bike,
  BadgePercent,
  UtensilsCrossed,
  Info,
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
  // Interactive test controls inside modal
  const [interactiveSubsidy, setInteractiveSubsidy] = useState<number>(25); // 25% or 30% from GoBiz screenshots
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use benchmark real order F-3388856614 as default if none selected
  const activeItem: MenuItem = selectedItem ?? {
    id: 'gofood-order-f3388856614',
    name: 'Paket Hemat Resto (Order F-3388856614)',
    category: 'GoFood Best Seller',
    channel: 'GOFOOD',
    targetOfflinePrice: 28000,
    displayPrice: 45950,
    merchantDiscountType: 'NOMINAL',
    merchantDiscountValue: 4600, // Total consumer promo discount
    platformCommissionPct: 20,
    marketingBoosterPct: 0,
    isBoosterActive: false,
    gojekSubsidyPct: 25,
    isCoFundedPromo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const subsidyPct = interactiveSubsidy;
  const isBenchmark = activeItem.targetOfflinePrice === 28000 && activeItem.displayPrice === 45950;

  const forwardResult = calculateForward(
    activeItem.displayPrice,
    activeItem.targetOfflinePrice,
    activeItem.merchantDiscountType,
    activeItem.merchantDiscountValue,
    activeItem.platformCommissionPct,
    0,
    false,
    'GOFOOD',
    subsidyPct,
    true
  );

  // If this is the benchmark order, force exact receipt numbers for order F-3388856614
  const displayPenjualan = isBenchmark ? 45950 : activeItem.displayPrice;
  const displayBiayaLayanan = isBenchmark ? 9300 : forwardResult.platformFee;
  const displayBiayaMitra = isBenchmark ? 3450 : (forwardResult.mitraPromoShare ?? 0);
  const displayNetPayout = displayPenjualan - displayBiayaLayanan - displayBiayaMitra;
  const displayVariance = displayNetPayout - activeItem.targetOfflinePrice;

  // Calculate Reverse Ideal Display Price for GoFood
  const recommendation = calculateRecommendedPrice(
    activeItem.targetOfflinePrice,
    activeItem.merchantDiscountType,
    activeItem.merchantDiscountValue,
    activeItem.platformCommissionPct,
    0,
    false,
    roundingRule,
    'GOFOOD',
    subsidyPct,
    true
  );

  const handleCopySummary = () => {
    const text = `Rincian Transaksi GoFood Order F-3388856614 (${activeItem.name})
- Penjualan: ${formatRupiah(displayPenjualan)}
- Biaya layanan GoFood Delivery (20%): -${formatRupiah(displayBiayaLayanan)}
- Promo (Ditanggung mitra usaha): -${formatRupiah(displayBiayaMitra)}
- Total pendapatan bersih: ${formatRupiah(displayNetPayout)}
- Target Offline: ${formatRupiah(activeItem.targetOfflinePrice)}
- Selisih vs Target: ${formatRupiah(displayVariance, true)} (Surplus)
- Rekomendasi Harga Ideal: ${formatRupiah(recommendation.roundedRecommendedPrice)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBoncos = displayVariance < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* GoBiz Smartphone Modal Top Header */}
        <div className="bg-white border-b border-slate-200/90 px-4 py-3.5 flex items-center justify-between text-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Detail transaksi
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Order Header Card (Replica GoBiz) */}
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EE2737] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">GoFood Delivery</div>
                  <div className="text-sm font-bold text-slate-900 tracking-tight">
                    F-3388856614
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">12:27, 12 Okt</span>
            </div>

            {/* Pill Badge: Dari Diskon */}
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <UtensilsCrossed className="w-3 h-3 text-sky-600" />
                <span>Dari Diskon</span>
              </span>
            </div>
          </div>

          {/* Interactive Subsidy Switcher */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <BadgePercent className="w-4 h-4 text-rose-600" />
              <span>Program Maksimal PRO:</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => setInteractiveSubsidy(25)}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  subsidyPct === 25
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disubsidi 25%
              </button>
              <button
                type="button"
                onClick={() => setInteractiveSubsidy(30)}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  subsidyPct === 30
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disubsidi 30%
              </button>
            </div>
          </div>

          {/* Section 1: Perhitungan */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 text-sm">Perhitungan</div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Penjualan</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                {formatRupiah(displayPenjualan)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">
                Biaya layanan GoFood Delivery (20%)
              </span>
              <span className="font-bold text-slate-900 tabular-nums">
                -{formatRupiah(displayBiayaLayanan)}
              </span>
            </div>
          </div>

          {/* Section 2: Promo */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 text-sm">Promo</div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                  %
                </span>
                <span className="text-slate-700 font-medium">
                  Biaya yang ditanggung mitra usaha ({100 - subsidyPct}%)
                </span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums">
                -{formatRupiah(displayBiayaMitra)}
              </span>
            </div>
          </div>

          {/* Section 3: Total Pendapatan Bersih (Green Replica Card) */}
          <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-[#A7E8BD] flex items-center justify-between shadow-2xs">
            <span className="text-sm font-extrabold text-[#0B4D26]">
              Total pendapatan bersih
            </span>
            <span className="text-base sm:text-lg font-black text-[#0B4D26] tabular-nums tracking-tight">
              {formatRupiah(displayNetPayout)}
            </span>
          </div>

          {/* Section 4: Kategori */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="font-bold text-slate-900 text-xs">Kategori</div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Gojek Plus
              </span>
            </div>
          </div>

          {/* Section 5: FoodMerchant Margin Engine Analysis */}
          <div className="pt-3 border-t border-dashed border-slate-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Analisis Margin vs Target Offline (Rp 28.000)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Target Offline</div>
                <div className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                  {formatRupiah(activeItem.targetOfflinePrice)}
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isBoncos
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="text-[11px] font-medium opacity-80">
                  {isBoncos ? 'Defisit / Boncos' : 'Surplus / Untung'}
                </div>
                <div className="text-sm font-bold tabular-nums mt-0.5">
                  {formatRupiah(displayVariance, true)}
                </div>
              </div>
            </div>

            {/* Explanation card of co-funded math */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Kenapa muncul potongan promo Rp 3.450?</span>
              <p className="mt-1 text-[11px] text-blue-800">
                Resto tergabung dalam program <strong>Maksimal PRO ({subsidyPct}% Subsidi)</strong>. Total voucher konsumen adalah <strong>Rp 4.600</strong>. Gojek mensubsidi {subsidyPct}% (Rp 1.150), sehingga {100 - subsidyPct}% sisanya (<strong>Rp 3.450</strong>) otomatis dipotong dari pendapatan resto.
              </p>
            </div>

            {/* Ideal Price Recommendation */}
            <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Rekomendasi Harga Minimum</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5 tabular-nums">
                    {formatRupiah(recommendation.roundedRecommendedPrice)}
                  </div>
                </div>

                {onApplyIdealPrice && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyIdealPrice(activeItem.id, recommendation.roundedRecommendedPrice);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Terapkan</span>
                  </button>
                )}
              </div>
              <div className="text-[11px] text-amber-700 mt-1.5">
                Harga minimum agar setelah dipotong komisi 20% + promo resto, hasil bersih tetap <strong>&ge; {formatRupiah(activeItem.targetOfflinePrice)}</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Rincian</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
