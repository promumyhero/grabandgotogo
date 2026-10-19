'use client';

import React from 'react';
import { GlobalPresets, RoundingRule, WorkspaceChannel } from '@/types/pricing';
import {
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Receipt,
  Database,
  Check,
} from 'lucide-react';

interface GlobalPresetBarProps {
  channel: WorkspaceChannel;
  presets: GlobalPresets;
  onPresetsChange: (newPresets: GlobalPresets) => void;
  onApplyAllIdealPrices: () => void;
  onApplyPresetsToAllItems: () => void;
  onResetDefaults: () => void;
  onOpenReceiptModal: () => void;
  onSyncDatabase: () => void;
  isSyncingDb: boolean;
  dbSyncStatus: 'idle' | 'success' | 'fallback' | 'error';
  dbSyncMessage?: string;
}

export function GlobalPresetBar({
  channel,
  presets,
  onPresetsChange,
  onApplyAllIdealPrices,
  onApplyPresetsToAllItems,
  onResetDefaults,
  onOpenReceiptModal,
  onSyncDatabase,
  isSyncingDb,
  dbSyncStatus,
  dbSyncMessage,
}: GlobalPresetBarProps) {
  const isGrab = channel === 'GRABFOOD';

  const updatePreset = <K extends keyof GlobalPresets>(key: K, value: GlobalPresets[K]) => {
    onPresetsChange({
      ...presets,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Preset Controls Grid */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Preset Global:</span>
          </div>

          {/* Commission % */}
          <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium">Komisi:</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={presets.platformCommissionPct}
              onChange={(e) =>
                updatePreset('platformCommissionPct', parseFloat(e.target.value) || 0)
              }
              className="w-10 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-1 py-0.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <span className="text-slate-500 font-semibold">%</span>
          </div>

          {/* Marketing Booster % (Grab PUAS) */}
          {isGrab && (
            <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <span className="text-slate-500 font-medium">PUAS Booster:</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={presets.marketingBoosterPct}
                onChange={(e) =>
                  updatePreset('marketingBoosterPct', parseFloat(e.target.value) || 0)
                }
                className="w-10 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-1 py-0.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-slate-500 font-semibold">%</span>
            </div>
          )}

          {/* GoFood Specific: Subsidi Promo Gojek (Maksimal PRO) */}
          {!isGrab && (
            <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <span className="text-slate-500 font-medium">Subsidi Gojek:</span>
              <select
                value={presets.gojekSubsidyPct ?? 25}
                onChange={(e) =>
                  updatePreset('gojekSubsidyPct', parseInt(e.target.value) || 25)
                }
                className="font-bold text-rose-700 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
                title="Persentase subsidi dari program Maksimal PRO (Gojek menanggung 25% atau 30%, mitra menanggung sisanya)"
              >
                <option value={25}>25% (Mitra 75%)</option>
                <option value={30}>30% (Mitra 70%)</option>
                <option value={0}>0% (Resto 100%)</option>
                <option value={50}>50% (50/50)</option>
              </select>
            </div>
          )}

          {/* Merchant Discount % */}
          <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium">
              {isGrab ? 'Diskon Mitra:' : 'Promo Konsumen:'}
            </span>
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={presets.merchantDiscountValue}
              onChange={(e) =>
                updatePreset('merchantDiscountValue', parseFloat(e.target.value) || 0)
              }
              className="w-10 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-1 py-0.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <span className="text-slate-500 font-semibold">%</span>
          </div>

          {/* Smart Rounding Rule */}
          <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium hidden sm:inline">Pembulatan:</span>
            <select
              value={presets.roundingRule}
              onChange={(e) =>
                updatePreset('roundingRule', e.target.value as RoundingRule)
              }
              className="font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="CEIL_500">Rp 500 (Ideal)</option>
              <option value="CEIL_1000">Rp 1.000</option>
              <option value="CEIL_100">Rp 100</option>
              <option value="EXACT">Rp 1 (Exact)</option>
            </select>
          </div>
        </div>

        {/* Right: Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {/* Apply All Ideal Prices */}
          <button
            type="button"
            id="btn-apply-all-ideal"
            onClick={onApplyAllIdealPrices}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
            title="Update harga display semua menu ke harga rekomendasi yang dijamin profit >= target offline"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Terapkan Semua Harga Ideal</span>
          </button>

          {/* Apply Preset to All */}
          <button
            type="button"
            onClick={onApplyPresetsToAllItems}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
            title="Terapkan % komisi & diskon preset ini ke seluruh baris menu di tabel"
          >
            <Check className="w-3 h-3 text-slate-600" />
            <span className="hidden sm:inline">Sinkronkan ke Menu</span>
            <span className="sm:hidden">Sinkron</span>
          </button>

          {/* Benchmark Receipt Simulation Button */}
          {isGrab ? (
            <button
              type="button"
              id="btn-simulate-receipt"
              onClick={onOpenReceiptModal}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
              title="Buka replika struk settlement pesanan GrabFood GF-957"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Struk GF-957</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-simulate-receipt-gofood"
              onClick={onOpenReceiptModal}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              title="Buka replika struk settlement pesanan GoFood F-3388856614"
            >
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
              <span>Struk F-3388856614</span>
            </button>
          )}

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={onResetDefaults}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-colors"
            title="Kembalikan preset dan contoh menu ke nilai awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Sync DB Button */}
          <button
            type="button"
            id="btn-sync-database"
            onClick={onSyncDatabase}
            disabled={isSyncingDb}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              dbSyncStatus === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : dbSyncStatus === 'fallback'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={dbSyncMessage || 'Simpan data ke PostgreSQL (fallback otomatis ke browser)'}
          >
            <Database className="w-3.5 h-3.5" />
            <span>
              {isSyncingDb
                ? 'Menyimpan...'
                : dbSyncStatus === 'success'
                ? 'Tersimpan (DB)'
                : dbSyncStatus === 'fallback'
                ? 'Lokal (Auto)'
                : 'Simpan DB'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
