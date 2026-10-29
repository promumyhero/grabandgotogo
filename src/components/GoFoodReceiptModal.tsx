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
  ShieldCheck,
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
  // Interactive test controls inside modal (starts from the item's own subsidy setting)
  const [interactiveSubsidy, setInteractiveSubsidy] = useState<number>(
    selectedItem?.gojekSubsidyPct ?? 25
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  // Benchmark order detection
  const isOrderF3388856614 =
    !selectedItem ||
    selectedItem.id === 'go-order-f3388856614' ||
    selectedItem.id === 'gofood-order-f3388856614';
  const isOrderF3392285639 = selectedItem?.id === 'go-order-f3392285639';
  const isBenchmarkOrder = isOrderF3388856614 || isOrderF3392285639;

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
  const isCoFunded = activeItem.isCoFundedPromo ?? true;
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

  // All numbers come straight from the engine:
  // Biaya layanan = komisi% x (Penjualan - Promo mitra) + Rp 800
  const displayPenjualan = activeItem.displayPrice;
  const displayBiayaLayanan = forwardResult.platformFee;
  const displayBiayaMitra = forwardResult.mitraPromoShare ?? 0;
  const displayTotalDiskon = forwardResult.discountAmount;
  const displaySubsidiGojek = forwardResult.gojekPromoShare ?? 0;
  const displayNetPayout = forwardResult.netPayout;
  const displayVariance = forwardResult.variance;

  // Calculate Reverse Ideal Display Price for GoFood (with the item's own discount)
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

  // Worst-case simulation: Maksimal PRO picks a discount between 10% and 50% per order
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
                    {orderNumber}
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium shrink-0">
                {orderTimestamp}
              </span>
            </div>

            {/* Pill Badge: Dari Diskon */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <UtensilsCrossed className="w-3 h-3 text-sky-600" />
                <span>Dari Diskon</span>
              </span>
              {isBenchmarkOrder && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Struk Nyata GoBiz
                </span>
              )}
            </div>
          </div>

          {/* Interactive Subsidy Switcher */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <BadgePercent className="w-4 h-4 text-rose-600" />
              <span>Subsidi Promo Gojek:</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => setInteractiveSubsidy(0)}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  subsidyPct === 0
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                0% (Mandiri)
              </button>
              <button
                type="button"
                onClick={() => setInteractiveSubsidy(25)}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  subsidyPct === 25
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                25%
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
                30%
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
              <div>
                <span className="text-slate-600 font-medium block">
                  Biaya layanan GoFood Delivery
                </span>
                <span className="text-slate-400 block text-[10px]">
                  {commissionPct}% x ({formatRupiah(displayPenjualan)} - {formatRupiah(displayBiayaMitra)}) + Rp 800
                </span>
              </div>
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

          {/* Section 4: Kategori Pelanggan (Gojek Plus) */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Kategori Pelanggan</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Disubsidi Gojek (Rp 0 Beban Toko)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                Gojek Plus
              </span>
              <span className="text-[11px] text-slate-500 leading-snug">
                Pelanggan langganan Gojek Plus. Diskon ongkir & promo eksklusif Plus dibiayai 100% oleh Gojek dan <strong>tidak memotong</strong> pendapatan resto.
              </span>
            </div>
          </div>

          {/* Section 5: FoodMerchant Margin Engine Analysis */}
          <div className="pt-3 border-t border-dashed border-slate-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Analisis Margin vs Target Offline ({formatRupiah(activeItem.targetOfflinePrice)})</span>
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
              <span className="font-bold">
                Kenapa muncul potongan promo {formatRupiah(displayBiayaMitra)}?
              </span>
              {isCoFunded ? (
                <p className="mt-1 text-[11px] text-blue-800">
                  Resto tergabung dalam program <strong>Maksimal PRO ({subsidyPct}% Subsidi)</strong>. Total diskon konsumen adalah <strong>{formatRupiah(displayTotalDiskon)}</strong>. Gojek mensubsidi {subsidyPct}% ({formatRupiah(displaySubsidiGojek)}), sehingga {100 - subsidyPct}% sisanya (<strong>{formatRupiah(displayBiayaMitra)}</strong>) dipotong dari pendapatan resto.
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-blue-800">
                  Diskon konsumen sebesar <strong>{formatRupiah(displayTotalDiskon)}</strong> ditanggung penuh oleh resto.
                </p>
              )}
            </div>

            {/* Worst-case simulation for Maksimal PRO dynamic discount (10% - 50%) */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="font-bold text-slate-800">
                  Simulasi Diskon Maksimal PRO (10% - 50%)
                </div>
                <div className="text-[10px] text-slate-500">
                  Pendapatan bersih di harga {formatRupiah(displayPenjualan)} bila Gojek memberi diskon sebesar:
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-slate-100">
                    <th className="px-3 py-1.5 text-left font-semibold">Diskon</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Promo Mitra</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Bersih</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {worstCaseRows.map((row) => (
                    <tr key={`wc-${row.pct}`}>
                      <td className="px-3 py-1.5 font-semibold text-slate-700">{row.pct}%</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                        -{formatRupiah(row.mitra)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-bold text-slate-900">
                        {formatRupiah(row.net)}
                      </td>
                      <td
                        className={`px-3 py-1.5 text-right tabular-nums font-bold ${
                          row.variance < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatRupiah(row.variance, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-600 block">
                    Harga kebal boncos (aman walau diskon 50%):
                  </span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Terapkan harga ini agar menu kebal boncos meskipun Gojek memberi diskon 50%"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pakai Harga Aman</span>
                  </button>
                )}
              </div>
            </div>

            {/* Ideal Price Recommendation */}
            <div className="p-3.5 bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
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
                Harga minimum (dengan diskon menu ini) agar setelah dipotong komisi {commissionPct}% + Rp 800 + promo resto, hasil bersih tetap <strong>&ge; {formatRupiah(activeItem.targetOfflinePrice)}</strong>.
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
