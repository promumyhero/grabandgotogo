'use client';

import React, { memo } from 'react';
import {
  CalculationResult,
  MenuItem,
} from '@/types/pricing';
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

interface PricingTableRowProps {
  item: MenuItem;
  calc?: CalculationResult;
  isGrab: boolean;
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

export const PricingTableRow = memo(function PricingTableRow({
  item,
  calc,
  isGrab,
  isSelected,
  isHighlighted,
  onToggleSelect,
  onUpdateItem,
  onApplyIdealPrice,
  onOpenEditModal,
  onOpenReceiptModal,
  onDuplicateItem,
  onDeleteItem,
}: PricingTableRowProps) {
  const isBoncos = calc ? calc.variance < 0 : false;

  return (
    <tr
      className={`group transition-colors duration-150 ${
        isHighlighted
          ? 'bg-emerald-50/60'
          : isSelected
          ? 'bg-slate-50'
          : 'hover:bg-slate-50/60'
      }`}
    >
      {/* 0. Selection Checkbox */}
      <td className="pl-4 pr-2 py-3 whitespace-nowrap border-b border-slate-100 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
          aria-label={`Pilih ${item.name}`}
        />
      </td>

      {/* 1. Menu Name & Category */}
      <td className="px-3 py-3 whitespace-nowrap border-b border-slate-100 text-left">
        <div className="font-semibold text-slate-900 tracking-tight">{item.name}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
          <span className="text-slate-500 font-medium">
            {item.category || 'Menu'}
          </span>
          {item.notes && (
            <span
              className="text-slate-400 truncate max-w-40 font-normal"
              title={item.notes}
            >
              · {item.notes}
            </span>
          )}
        </div>
      </td>

      {/* 2. Target Offline Price (Editable Inline) */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-right">
        <div className="inline-flex items-center justify-end gap-1 rounded-md border border-transparent hover:border-slate-200 focus-within:border-slate-400 focus-within:bg-white px-1.5 py-1 transition-colors">
          <span className="text-[11px] text-slate-400 select-none">Rp</span>
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
            className="w-20 text-right font-semibold text-slate-900 bg-transparent tabular-nums focus:outline-none"
          />
        </div>
      </td>

      {/* 3. Display Price (Editable Inline + Customer Paid Preview) */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-right">
        <div className="inline-flex items-center justify-end gap-1 rounded-md border border-transparent hover:border-slate-200 focus-within:border-slate-400 focus-within:bg-white px-1.5 py-1 transition-colors">
          <span className="text-[11px] text-slate-400 select-none">Rp</span>
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
            className={`w-20 text-right font-semibold bg-transparent tabular-nums focus:outline-none ${
              isBoncos ? 'text-rose-700' : 'text-slate-900'
            }`}
          />
        </div>
        {calc && calc.discountAmount > 0 && (
          <div
            className="text-[10px] text-slate-400 mt-0.5 tabular-nums pr-1.5"
            title="Harga yang dibayar konsumen setelah diskon"
          >
            Konsumen: <span className="font-medium text-slate-600">{formatRupiah(calc.subtotalAfterDiscount)}</span>
          </div>
        )}
      </td>

      {/* 4. Merchant Discount Type & Value */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-right">
        <div className="inline-flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              onUpdateItem(item.id, {
                merchantDiscountType:
                  item.merchantDiscountType === 'PERCENT'
                    ? 'NOMINAL'
                    : 'PERCENT',
              })
            }
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Klik untuk beralih antara % dan Rp"
          >
            {item.merchantDiscountType === 'PERCENT' ? '%' : 'Rp'}
          </button>
          <input
            type="number"
            min="0"
            max={item.merchantDiscountType === 'PERCENT' ? 100 : undefined}
            placeholder="0"
            aria-label={`Nilai diskon ${item.name}`}
            value={item.merchantDiscountValue === 0 ? '' : item.merchantDiscountValue}
            onFocus={handleNumberInputFocus}
            onChange={(e) => {
              const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, {
                min: 0,
                max: item.merchantDiscountType === 'PERCENT' ? 100 : undefined,
              });
              e.target.value = stringValue;
              onUpdateItem(item.id, { merchantDiscountValue: numericValue });
            }}
            className="w-15 text-right font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-slate-400 rounded-md px-1.5 py-1 tabular-nums focus:outline-none transition-colors"
          />
        </div>
        {calc && calc.discountAmount > 0 && (
          <div
            className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums pr-1.5"
            title={
              !isGrab
                ? `Total diskon konsumen: ${formatRupiah(calc.discountAmount)} · Disubsidi Gojek: ${formatRupiah(calc.gojekPromoShare ?? 0)} · Beban Mitra: ${formatRupiah(calc.mitraPromoShare ?? 0)}`
                : undefined
            }
          >
            {isGrab
              ? `-${formatRupiah(calc.discountAmount)}`
              : `Mitra: -${formatRupiah(calc.mitraPromoShare ?? calc.discountAmount)}`}
          </div>
        )}
      </td>

      {/* 5. Booster (Grab) or Subsidi Promo (GoFood) */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-center">
        {isGrab ? (
          <button
            type="button"
            role="switch"
            aria-checked={item.isBoosterActive}
            onClick={() =>
              onUpdateItem(item.id, {
                isBoosterActive: !item.isBoosterActive,
              })
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
              item.isBoosterActive
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
            title={
              item.isBoosterActive
                ? 'Booster Aktif: +14% Biaya Sukses Pemasaran'
                : 'Booster Nonaktif: Rp 0'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.isBoosterActive ? 'bg-emerald-400' : 'bg-slate-300'
              }`}
            />
            <span>{item.isBoosterActive ? 'Aktif (14%)' : 'Nonaktif'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const current = item.gojekSubsidyPct ?? 25;
              const next = current === 25 ? 30 : current === 30 ? 0 : 25;
              onUpdateItem(item.id, { gojekSubsidyPct: next });
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 hover:bg-slate-200/70 transition-colors cursor-pointer tabular-nums"
            title="Klik untuk ubah skema subsidi Gojek (25% / 30% / 0%)"
          >
            <span>
              {(item.gojekSubsidyPct ?? 25) > 0
                ? `Subsidi ${item.gojekSubsidyPct ?? 25}%`
                : 'Mandiri (0%)'}
            </span>
          </button>
        )}
      </td>

      {/* 6. Total Platform Deduction */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-right">
        <div
          className="font-medium text-slate-700 tabular-nums"
          title={
            !isGrab && calc
              ? `Biaya Layanan GoFood: ${formatRupiah(calc.platformFee)} + Promo Mitra: ${formatRupiah(calc.mitraPromoShare ?? 0)}`
              : undefined
          }
        >
          {calc ? `-${formatRupiah(calc.totalPlatformDeduction)}` : '-'}
        </div>
        <div className="text-[10px] text-slate-400 tabular-nums">
          {calc
            ? isGrab
              ? `${calc.effectiveCommissionRatePct}% potongan`
              : `Layanan ${formatRupiah(calc.platformFee)}`
            : ''}
        </div>
      </td>

      {/* 7. Net Payout */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-right">
        <div
          className={`text-xs font-bold tabular-nums tracking-tight ${
            isBoncos ? 'text-rose-700' : 'text-slate-900'
          }`}
        >
          {calc ? formatRupiah(calc.netPayout) : '-'}
        </div>
        <div className="text-[10px] text-slate-400 tabular-nums">
          {calc ? `${calc.effectiveMerchantMarginPct}% margin` : ''}
        </div>
      </td>

      {/* 8. Status Badge & Variance vs Target */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-center">
        {calc && (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums border ${
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
      </td>

      {/* 9. Recommended Display Price & 1-Click Apply */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-right">
        {calc && (
          <div className="flex items-center justify-end gap-2">
            <div className="text-right">
              <div className="font-semibold text-slate-800 tabular-nums text-xs">
                {formatRupiah(calc.recommendedDisplayPriceRounded)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                min {formatRupiah(calc.recommendedDisplayPriceExact)}
              </div>
            </div>
            {calc.variance < 0 && (
              <button
                type="button"
                onClick={() =>
                  onApplyIdealPrice(item.id, calc.recommendedDisplayPriceRounded)
                }
                className="px-2 py-1 text-[11px] font-semibold text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-200/90 rounded-md transition-colors cursor-pointer inline-flex items-center gap-0.5"
                title="Terapkan harga rekomendasi untuk menutup defisit"
              >
                <span>Terapkan</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </td>

      {/* 10. Actions */}
      <td className="px-3.5 py-3 whitespace-nowrap border-b border-slate-100 text-center">
        <div className="flex items-center justify-center gap-0.5">
          <button
            type="button"
            onClick={() => onOpenEditModal(item)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Edit rincian menu"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onOpenReceiptModal(item)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Simulasi struk pembayaran"
            aria-label={`Lihat struk ${item.name}`}
          >
            <Receipt className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDuplicateItem(item)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Duplikat menu"
            aria-label={`Duplikat ${item.name}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteItem(item.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="Hapus menu"
            aria-label={`Hapus ${item.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

