'use client';

import React, { memo } from 'react';
import { MenuItem, CalculationResult } from '@/types/pricing';
import { formatRupiah } from '@/lib/pricing-engine';
import { ArrowUpRight } from 'lucide-react';

interface KpiSummaryCardsProps {
  items: MenuItem[];
  calculations: Map<string, CalculationResult>;
  onApplyAllIdealPrices: () => void;
}

export const KpiSummaryCards = memo(function KpiSummaryCards({
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Menu Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex flex-col justify-between">
        <div className="text-xs font-medium text-slate-500">Total Menu</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {totalCount}
          </span>
          <span className="text-xs text-slate-400">item</span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Target Offline</span>
          <span className="font-semibold text-slate-800 tabular-nums">
            {formatRupiah(totalTargetOffline)}
          </span>
        </div>
      </div>

      {/* 2. Menu Defisit / Boncos Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                boncosCount > 0 ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            />
            <span>Menu Defisit</span>
          </span>
          {boncosCount > 0 && (
            <button
              type="button"
              onClick={onApplyAllIdealPrices}
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-900 hover:text-slate-600 underline underline-offset-2 transition-colors cursor-pointer"
              title="Sesuaikan semua menu defisit ke harga ideal"
            >
              <span>Sesuaikan</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-bold tracking-tight tabular-nums ${
              boncosCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {boncosCount}
          </span>
          <span className="text-xs text-slate-400 tabular-nums">
            ({totalCount > 0 ? Math.round((boncosCount / totalCount) * 100) : 0}%)
          </span>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total Defisit</span>
          <span
            className={`font-semibold tabular-nums ${
              totalLossAmount > 0 ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            {totalLossAmount > 0 ? `-${formatRupiah(totalLossAmount)}` : 'Rp 0'}
          </span>
        </div>
      </div>

      {/* 3. Menu Margin Aman Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex flex-col justify-between">
        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Margin Aman</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {safeCount}
          </span>
          <span className="text-xs text-slate-400 tabular-nums">
            ({totalCount > 0 ? Math.round((safeCount / totalCount) * 100) : 0}%)
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Surplus</span>
          <span className="font-semibold text-emerald-700 tabular-nums">
            +{formatRupiah(totalProfitAmount)}
          </span>
        </div>
      </div>

      {/* 4. Average Net Payout Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex flex-col justify-between">
        <div className="text-xs font-medium text-slate-500">Rata-Rata Payout</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
            {formatRupiah(avgNetPayout)}
          </span>
          <span className="text-xs text-slate-400">/porsi</span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Selisih Bersih</span>
          <span
            className={`font-semibold tabular-nums ${
              overallVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatRupiah(overallVariance, true)}
          </span>
        </div>
      </div>
    </div>
  );
});
