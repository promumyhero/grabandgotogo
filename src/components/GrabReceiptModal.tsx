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
  ArrowUpRight,
  Copy,
  Check,
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
  const [interactiveBooster, setInteractiveBooster] = useState<boolean | null>(null);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grab-receipt-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Minimalist Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#00B14F]" />
              <span>GrabMerchant Settlement</span>
              <span>·</span>
              <span className="font-mono">GF-957</span>
            </div>
            <h3 id="grab-receipt-title" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Rincian Pembayaran Pesanan
            </h3>
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
          {/* Menu Item Name & Live Simulation Switcher */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
            <div className="text-[11px] text-slate-500">Menu Pesanan</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 tracking-tight">
              {activeItem.name}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Simulasi PUAS Booster (14%)</span>
              <button
                type="button"
                role="switch"
                aria-checked={isBooster}
                onClick={() => setInteractiveBooster(!isBooster)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isBooster ? 'bg-slate-900' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    isBooster ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section A: Customer Subtotal Calculation */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-900">
              1. Rincian Belanja Konsumen
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Harga Menu di Aplikasi</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatRupiah(activeItem.displayPrice)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100 text-rose-600">
              <span>
                Diskon Didanai Resto ({activeItem.merchantDiscountType === 'PERCENT' ? `${discountVal}%` : formatRupiah(discountVal)})
              </span>
              <span className="font-semibold tabular-nums">
                -{formatRupiah(forwardResult.discountAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 bg-slate-50 px-2.5 rounded-md font-semibold text-slate-900">
              <span>Subtotal Konsumen</span>
              <span className="tabular-nums">
                {formatRupiah(forwardResult.subtotalAfterDiscount)}
              </span>
            </div>
          </div>

          {/* Section B: Grab Deductions */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-900">
              2. Rincian Pemotongan Grab
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-700">Bagi Hasil Layanan GrabFood</span>
                <span className="text-slate-400 block text-[10px] tabular-nums">
                  {activeItem.platformCommissionPct}% × Subtotal ({formatRupiah(forwardResult.subtotalAfterDiscount)})
                </span>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums">
                -{formatRupiah(forwardResult.platformFee)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-700">Biaya Sukses Pemasaran (PUAS)</span>
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

            <div className="flex justify-between items-center py-1.5 bg-slate-50 px-2.5 rounded-md text-slate-900 font-semibold">
              <span>Total Potongan Platform ({forwardResult.effectiveCommissionRatePct}%)</span>
              <span className="tabular-nums">
                -{formatRupiah(forwardResult.totalPlatformDeduction)}
              </span>
            </div>
          </div>

          {/* Section C: Net Merchant Payout */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Payout Bersih Masuk Rekening</span>
              <span className="font-mono text-slate-300 text-[11px]">{forwardResult.effectiveMerchantMarginPct}% margin</span>
            </div>

            <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
              {formatRupiah(forwardResult.netPayout)}
            </div>

            <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Offline ({formatRupiah(activeItem.targetOfflinePrice)})</span>
              <span
                className={`font-semibold tabular-nums ${
                  isBoncos ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatRupiah(forwardResult.variance, true)} ({isBoncos ? 'Defisit' : 'Aman'})
              </span>
            </div>
          </div>

          {/* Section D: Ideal Recommended Display Price */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block">
                Rekomendasi Harga Minimum
              </span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {formatRupiah(recommendation.roundedRecommendedPrice)}
              </span>
              <span className="text-[11px] text-slate-400 ml-1.5 font-mono tabular-nums">
                (eksak {formatRupiah(recommendation.exactRecommendedPrice)})
              </span>
            </div>

            {onApplyIdealPrice && (
              <button
                type="button"
                onClick={() => {
                  onApplyIdealPrice(activeItem.id, recommendation.roundedRecommendedPrice);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Terapkan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between">
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
