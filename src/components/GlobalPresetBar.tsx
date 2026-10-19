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
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Preset Controls */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wide shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Preset Global:</span>
          </div>

          {/* Commission % */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Komisi Layanan:</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={presets.platformCommissionPct}
              onChange={(e) =>
                updatePreset('platformCommissionPct', parseFloat(e.target.value) || 0)
              }
              className="w-12 text-right font-semibold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-slate-600 font-medium">%</span>
          </div>

          {/* Marketing Booster % (Grab PUAS) */}
          {isGrab && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
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
                className="w-12 text-right font-semibold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-slate-600 font-medium">%</span>
            </div>
          )}

          {/* Merchant Discount % */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Diskon Mitra:</span>
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={presets.merchantDiscountValue}
              onChange={(e) =>
                updatePreset('merchantDiscountValue', parseFloat(e.target.value) || 0)
              }
              className="w-12 text-right font-semibold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-slate-600 font-medium">%</span>
          </div>

          {/* Smart Rounding Rule */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Pembulatan Ideal:</span>
            <select
              value={presets.roundingRule}
              onChange={(e) =>
                updatePreset('roundingRule', e.target.value as RoundingRule)
              }
              className="font-semibold text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="CEIL_500">Ke Atas Rp 500 (Rekomendasi)</option>
              <option value="CEIL_1000">Ke Atas Rp 1.000</option>
              <option value="CEIL_100">Ke Atas Rp 100</option>
              <option value="EXACT">Tepat Rp 1 (Tanpa Dibulatkan)</option>
            </select>
          </div>
        </div>

        {/* Right: Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Apply All Ideal Prices */}
          <button
            type="button"
            id="btn-apply-all-ideal"
            onClick={onApplyAllIdealPrices}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Update harga display semua menu ke harga rekomendasi yang dijamin profit >= target offline"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Terapkan Semua Harga Ideal</span>
          </button>

          {/* Apply Preset to All */}
          <button
            type="button"
            onClick={onApplyPresetsToAllItems}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Terapkan % komisi & diskon preset ini ke seluruh baris menu di tabel"
          >
            <Check className="w-3 h-3 text-slate-600" />
            <span>Sinkronkan ke Menu</span>
          </button>

          {/* Benchmark GF-957 Receipt Simulation Button */}
          {isGrab && (
            <button
              type="button"
              id="btn-simulate-receipt"
              onClick={onOpenReceiptModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="Buka replika struk settlement pesanan GF-957"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulasi Struk GF-957</span>
            </button>
          )}

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={onResetDefaults}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              dbSyncStatus === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : dbSyncStatus === 'fallback'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                ? 'Tersimpan (Lokal)'
                : 'Simpan DB'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
