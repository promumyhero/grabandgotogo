'use client';

import React, { memo } from 'react';
import { CalculationResult, MenuItem } from '@/types/pricing';
import { formatRupiah } from '@/lib/pricing-engine';
import {
  sanitizeNumericInput,
  handleNumberInputFocus,
} from '@/lib/input-utils';
import {
  Receipt,
  Trash2,
  Copy,
  Pencil,
  ArrowUpRight,
} from 'lucide-react';

interface PricingItemCardProps {
  item: MenuItem;
  calc?: CalculationResult;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<MenuItem>) => void;
  onApplyIdealPrice: (id: string, price: number) => void;
  onOpenEditModal: (item: MenuItem) => void;
  onOpenReceiptModal: (item: MenuItem) => void;
  onDuplicateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
}

export const PricingItemCard = memo(function PricingItemCard({
  item,
  calc,
  isSelected,
  isHighlighted,
  onToggleSelect,
  onUpdateItem,
  onApplyIdealPrice,
  onOpenEditModal,
  onOpenReceiptModal,
  onDuplicateItem,
  onDeleteItem,
}: PricingItemCardProps) {
  const isBoncos = calc ? calc.variance < 0 : false;

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 ${
        isHighlighted
          ? 'ring-2 ring-emerald-500/80 bg-emerald-50/30 border-emerald-300'
          : isSelected
          ? 'ring-1 ring-slate-900 bg-slate-50/60 border-slate-300'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-2.5 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="mt-1 w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer shrink-0"
            aria-label={`Pilih ${item.name}`}
          />
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900 text-sm truncate">{item.name}</h4>
            <span className="inline-block text-slate-500 font-medium text-[11px] mt-0.5">
              {item.category || 'Menu'}
            </span>
          </div>
        </div>

        {calc && (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums shrink-0 border ${
              isBoncos
                ? 'bg-rose-50/70 text-rose-700 border-rose-200/80'
                : 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBoncos ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
            <span>{formatRupiah(calc.variance, true)}</span>
          </span>
        )}
      </div>

      {/* Card Key Metrics */}
      <div className="grid grid-cols-2 gap-3 py-3 text-xs border-b border-slate-100">
        <div>
          <label className="text-slate-400 block text-[11px] mb-1">Target Offline</label>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:bg-white focus-within:border-slate-400">
            <span className="text-slate-400 select-none">Rp</span>
            <input
              type="number"
              step="500"
              min="0"
              placeholder="0"
              aria-label={`Target offline ${item.name}`}
              value={item.targetOfflinePrice === 0 ? '' : item.targetOfflinePrice}
              onFocus={handleNumberInputFocus}
              onChange={(e) => {
                const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                e.target.value = stringValue;
                onUpdateItem(item.id, { targetOfflinePrice: numericValue });
              }}
              className="w-full font-semibold text-slate-900 bg-transparent tabular-nums focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-400 block text-[11px] mb-1">Harga Jual App</label>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:bg-white focus-within:border-slate-400">
            <span className="text-slate-400 select-none">Rp</span>
            <input
              type="number"
              step="500"
              min="0"
              placeholder="0"
              aria-label={`Harga jual aplikasi ${item.name}`}
              value={item.displayPrice === 0 ? '' : item.displayPrice}
              onFocus={handleNumberInputFocus}
              onChange={(e) => {
                const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                e.target.value = stringValue;
                onUpdateItem(item.id, { displayPrice: numericValue });
              }}
              className="w-full font-semibold text-slate-900 bg-transparent tabular-nums focus:outline-none"
            />
          </div>
          {calc && calc.discountAmount > 0 && (
            <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
              Konsumen: <strong className="text-slate-600">{formatRupiah(calc.subtotalAfterDiscount)}</strong>
            </span>
          )}
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Net Payout Bersih</span>
          <span className="text-sm font-bold text-slate-900 tabular-nums">
            {calc ? formatRupiah(calc.netPayout) : '-'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Potongan Platform</span>
          <span className="text-sm font-medium text-slate-700 tabular-nums">
            {calc ? `-${formatRupiah(calc.totalPlatformDeduction)}` : '-'}
          </span>
        </div>
      </div>

      {/* Card Ideal Price Recommendation & Actions */}
      <div className="pt-3 flex items-center justify-between gap-2">
        {calc && isBoncos ? (
          <button
            type="button"
            onClick={() =>
              onApplyIdealPrice(item.id, calc.recommendedDisplayPriceRounded)
            }
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer tabular-nums"
          >
            <span>Terapkan {formatRupiah(calc.recommendedDisplayPriceRounded)}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Margin Aman</span>
          </div>
        )}

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onOpenEditModal(item)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Edit rincian menu"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenReceiptModal(item)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Lihat Struk"
            aria-label={`Lihat struk ${item.name}`}
          >
            <Receipt className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicateItem(item)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Duplikat"
            aria-label={`Duplikat ${item.name}`}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteItem(item.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="Hapus"
            aria-label={`Hapus ${item.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

