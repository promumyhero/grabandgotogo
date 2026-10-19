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
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';

interface GrabReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: MenuItem | null;
  roundingRule?: RoundingRule;
  onApplyIdealPrice?: (itemId: string, newPrice: number) => void;
}

export function GrabReceiptModal({
  isOpen,
  onClose,
  selectedItem,
  roundingRule = 'CEIL_500',
  onApplyIdealPrice,
}: GrabReceiptModalProps) {
  // Local interactive overrides inside modal for experimentation
  const [interactiveBooster, setInteractiveBooster] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use benchmark item GF-957 as default if none selected
  const activeItem: MenuItem = selectedItem ?? {
    id: 'gf-benchmark-modal',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const isBooster =
    interactiveBooster !== null ? interactiveBooster : activeItem.isBoosterActive;
  const discountVal = activeItem.merchantDiscountValue;

  const forwardResult = calculateForward(
    activeItem.displayPrice,
    activeItem.targetOfflinePrice,
    activeItem.merchantDiscountType,
    discountVal,
    activeItem.platformCommissionPct,
    activeItem.marketingBoosterPct,
    isBooster
  );

  const recommendation = calculateRecommendedPrice(
    activeItem.targetOfflinePrice,
    activeItem.merchantDiscountType,
    discountVal,
    activeItem.platformCommissionPct,
    activeItem.marketingBoosterPct,
    isBooster,
    roundingRule
  );

  const handleCopySummary = () => {
    const text = `Rincian GrabFood Order GF-957 (${activeItem.name})
- Harga Tampilan: ${formatRupiah(activeItem.displayPrice)}
- Diskon Mitra (${discountVal}%): -${formatRupiah(forwardResult.discountAmount)}
- Subtotal Konsumen: ${formatRupiah(forwardResult.subtotalAfterDiscount)}
- Komisi Layanan (20%): -${formatRupiah(forwardResult.platformFee)}
- PUAS Booster (${isBooster ? '14%' : 'OFF'}): -${formatRupiah(forwardResult.marketingFee)}
- Payout Bersih: ${formatRupiah(forwardResult.netPayout)}
- Target Offline: ${formatRupiah(activeItem.targetOfflinePrice)}
- Selisih: ${formatRupiah(forwardResult.variance, true)}
- Rekomendasi Harga Ideal: ${formatRupiah(recommendation.roundedRecommendedPrice)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBoncos = forwardResult.variance < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Grab Smartphone Modal Header */}
        <div className="bg-[#00B14F] text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide uppercase text-emerald-100 flex items-center gap-1.5">
                <span>GrabMerchant App</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
                <span className="font-mono">GF-957</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Rincian Pembayaran Pesanan
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Order Status Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Status Pesanan:
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Selesai
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Order GF-957</span>
          </div>

          {/* Menu Item Name & Live Simulation Switcher */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Menu Pesanan</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {activeItem.name}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">PUAS Booster (14%):</span>
              <button
                type="button"
                onClick={() => setInteractiveBooster(!isBooster)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isBooster ? 'bg-[#00B14F]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isBooster ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section A: Customer Subtotal Calculation */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
              A. Rincian Belanja Konsumen
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Harga Menu di Aplikasi</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatRupiah(activeItem.displayPrice)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100 text-rose-600">
              <span className="flex items-center gap-1">
                <span>Diskon Didanai Resto ({discountVal}%)</span>
              </span>
              <span className="font-semibold tabular-nums">
                -{formatRupiah(forwardResult.discountAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 bg-slate-50 px-2 rounded-lg font-bold text-slate-800">
              <span>Subtotal Setelah Diskon</span>
              <span className="tabular-nums">
                {formatRupiah(forwardResult.subtotalAfterDiscount)}
              </span>
            </div>
          </div>

          {/* Section B: Grab Deductions (Exact GF-957 Breakdown) */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
              B. Rincian Pemotongan Grab
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-700 font-medium">Bagi Hasil Layanan GrabFood</span>
                <span className="text-slate-400 block text-[10px]">
                  {activeItem.platformCommissionPct}% x Subtotal (Rp{' '}
                  {forwardResult.subtotalAfterDiscount.toLocaleString('id-ID')})
                </span>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums">
                -{formatRupiah(forwardResult.platformFee)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-700 font-medium">Biaya Sukses Pemasaran (PUAS)</span>
                <span className="text-slate-400 block text-[10px]">
                  {isBooster ? `${activeItem.marketingBoosterPct}% (Booster Aktif)` : 'Nonaktif (0%)'}
                </span>
              </div>
              <span
                className={`font-semibold tabular-nums ${
                  isBooster ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                -{formatRupiah(forwardResult.marketingFee)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 bg-amber-50/60 px-2 rounded-lg text-amber-900 font-semibold">
              <span>Total Potongan Grab ({forwardResult.effectiveCommissionRatePct}%)</span>
              <span className="tabular-nums">
                -{formatRupiah(forwardResult.totalPlatformDeduction)}
              </span>
            </div>
          </div>

          {/* Section C: Net Merchant Payout (Big Highlight) */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>C. Payout Bersih Masuk Rekening Mitra</span>
              <span className="font-mono text-emerald-400 font-semibold">Settlement Net</span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                {formatRupiah(forwardResult.netPayout)}
              </span>
              <span className="text-xs text-slate-400">
                ({forwardResult.effectiveMerchantMarginPct}% margin)
              </span>
            </div>

            {/* Target Offline Comparison & Variance */}
            <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Offline Resto:</span>
              <span className="text-white font-semibold tabular-nums">
                {formatRupiah(activeItem.targetOfflinePrice)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Selisih vs Target:</span>
              <span
                className={`font-bold tabular-nums px-2 py-0.5 rounded-md ${
                  isBoncos
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                    : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                }`}
              >
                {formatRupiah(forwardResult.variance, true)}{' '}
                {isBoncos ? '(Boncos / Rugi)' : '(Aman)'}
              </span>
            </div>
          </div>

          {/* Section D: Ideal Recommended Display Price */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Rekomendasi Harga Ideal (Anti-Boncos)</span>
            </div>
            <p className="text-xs text-emerald-950/80 leading-relaxed">
              Agar net payout Anda minimal mencapai target{' '}
              <strong>{formatRupiah(activeItem.targetOfflinePrice)}</strong> dengan skema diskon{' '}
              {discountVal}% dan booster {isBooster ? '14%' : 'OFF'}:
            </p>
            <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-lg p-2.5 shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block">
                  Harga Tampilan Disarankan:
                </span>
                <span className="text-base font-bold text-emerald-700 tabular-nums">
                  {formatRupiah(recommendation.roundedRecommendedPrice)}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                  (min exact: {formatRupiah(recommendation.exactRecommendedPrice)})
                </span>
              </div>

              {onApplyIdealPrice && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyIdealPrice(activeItem.id, recommendation.roundedRecommendedPrice);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Pakai Harga Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{copied ? 'Tersalin!' : 'Salin Rincian'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
