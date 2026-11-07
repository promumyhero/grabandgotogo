'use client';

import React, { memo } from 'react';
import { MenuItem } from '@/types/pricing';
import { Check, Download, Trash2, ArrowUpRight } from 'lucide-react';

interface BulkActionBarProps {
  isGrab: boolean;
  selectedCount: number;
  totalFilteredCount: number;
  allCategories: string[];
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onBulkApplyIdealPrices: () => void;
  onBulkUpdateItems: (updates: Partial<MenuItem>, actionLabel: string) => void;
  onExportSelectedCsv: () => void;
  onBulkDelete: () => void;
}

export const BulkActionBar = memo(function BulkActionBar({
  isGrab,
  selectedCount,
  totalFilteredCount,
  allCategories,
  onSelectAllFiltered,
  onClearSelection,
  onBulkApplyIdealPrices,
  onBulkUpdateItems,
  onExportSelectedCsv,
  onBulkDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-popover">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-white font-semibold tabular-nums">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{selectedCount} dipilih</span>
        </span>

        {selectedCount < totalFilteredCount && (
          <button
            type="button"
            onClick={onSelectAllFiltered}
            className="text-[11px] font-medium text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer"
          >
            Pilih semua ({totalFilteredCount})
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer"
        >
          Batal
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onBulkApplyIdealPrices}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
          title="Terapkan Harga Ideal pada menu yang dicentang"
        >
          <span>Terapkan Harga Ideal</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {isGrab ? (
          <>
            <button
              type="button"
              onClick={() =>
                onBulkUpdateItems({ isBoosterActive: true }, 'Aktifkan PUAS Booster')
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              Booster ON
            </button>
            <button
              type="button"
              onClick={() =>
                onBulkUpdateItems({ isBoosterActive: false }, 'Matikan PUAS Booster')
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              Booster OFF
            </button>
          </>
        ) : (
          <select
            defaultValue=""
            aria-label="Ubah subsidi Gojek secara massal"
            onChange={(e) => {
              if (!e.target.value) return;
              const pct = Number(e.target.value);
              onBulkUpdateItems(
                { gojekSubsidyPct: pct, isCoFundedPromo: pct > 0 },
                `Set Subsidi Gojek ${pct}%`
              );
              e.target.value = '';
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="" disabled>
              Ubah Subsidi...
            </option>
            <option value="25">Subsidi 25%</option>
            <option value="30">Subsidi 30%</option>
            <option value="0">Subsidi 0%</option>
          </select>
        )}

        <select
          defaultValue=""
          aria-label="Pindah kategori secara massal"
          onChange={(e) => {
            if (!e.target.value) return;
            onBulkUpdateItems(
              { category: e.target.value },
              `Pindah ke kategori "${e.target.value}"`
            );
            e.target.value = '';
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 cursor-pointer focus:outline-none"
        >
          <option value="" disabled>
            Pindah Kategori...
          </option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onExportSelectedCsv}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-colors cursor-pointer"
          title="Download CSV untuk menu yang dicentang"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CSV</span>
        </button>

        <button
          type="button"
          onClick={onBulkDelete}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer"
          title="Hapus semua menu yang dicentang"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
});

