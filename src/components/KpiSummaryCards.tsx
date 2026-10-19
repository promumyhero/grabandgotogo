'use client';

import React from 'react';
import { MenuItem, CalculationResult } from '@/types/pricing';
import { formatRupiah } from '@/lib/pricing-engine';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Layers,
  Wand2,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

interface KpiSummaryCardsProps {
  items: MenuItem[];
  calculations: Map<string, CalculationResult>;
  onApplyAllIdealPrices: () => void;
}

export function KpiSummaryCards({
  items,
  calculations,
  onApplyAllIdealPrices,
}: KpiSummaryCardsProps) {
  const totalCount = items.length;

  let boncosCount = 0;
  let safeCount = 0;
  let totalLossAmount = 0;
  let totalProfitAmount = 0;
  let totalTargetOffline = 0;
  let totalNetPayout = 0;

  for (const item of items) {
    const calc = calculations.get(item.id);
    if (!calc) continue;

    totalTargetOffline += item.targetOfflinePrice;
    totalNetPayout += calc.netPayout;

    if (calc.variance < 0) {
      boncosCount++;
      totalLossAmount += Math.abs(calc.variance);
    } else {
      safeCount++;
      totalProfitAmount += calc.variance;
    }
  }

  const avgNetPayout = totalCount > 0 ? Math.round(totalNetPayout / totalCount) : 0;
  const overallVariance = totalNetPayout - totalTargetOffline;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Menu Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Menu Aktif</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalCount}</span>
          <span className="text-xs text-slate-500">item terdaftar</span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Target Offline Total:</span>
          <span className="font-semibold text-slate-700 tabular-nums">
            {formatRupiah(totalTargetOffline)}
          </span>
        </div>
      </div>

      {/* 2. Menu Boncos / Deficit Warning Card */}
      <div
        className={`rounded-xl border p-4 shadow-xs transition-all ${
          boncosCount > 0
            ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
            : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              boncosCount > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}
          >
            Menu Kurang / Boncos
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              boncosCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tabular-nums ${
                boncosCount > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {boncosCount}
            </span>
            <span className="text-xs text-rose-600 font-medium">
              ({totalCount > 0 ? Math.round((boncosCount / totalCount) * 100) : 0}%)
            </span>
          </div>

          {boncosCount > 0 && (
            <button
              type="button"
              onClick={onApplyAllIdealPrices}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-800 bg-rose-200/70 hover:bg-rose-300/80 rounded-md transition-colors"
              title="Perbaiki semua harga boncos ke harga ideal"
            >
              <Wand2 className="w-3 h-3" />
              Perbaiki
            </button>
          )}
        </div>
        <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs">
          <span className="text-rose-700">Potensi Rugi / Porsi:</span>
          <span className="font-bold text-rose-700 tabular-nums">
            {totalLossAmount > 0 ? `-${formatRupiah(totalLossAmount)}` : 'Rp 0'}
          </span>
        </div>
      </div>

      {/* 3. Menu Aman / Profit Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">
            Menu Aman & Profit
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-700 tabular-nums">{safeCount}</span>
          <span className="text-xs text-emerald-600 font-medium">
            ({totalCount > 0 ? Math.round((safeCount / totalCount) * 100) : 0}%)
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Surplus vs Target:</span>
          <span className="font-semibold text-emerald-700 tabular-nums">
            +{formatRupiah(totalProfitAmount)}
          </span>
        </div>
      </div>

      {/* 4. Average Payout vs Target */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Rata-Rata Payout</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(avgNetPayout)}
          </span>
          <span className="text-xs text-slate-400">/ porsi</span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Net Selisih:</span>
          <span
            className={`font-semibold tabular-nums flex items-center gap-0.5 ${
              overallVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {overallVariance >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 inline" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 inline" />
            )}
            {formatRupiah(overallVariance, true)}
          </span>
        </div>
      </div>
    </div>
  );
}
