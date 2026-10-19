'use client';

import React from 'react';
import { WorkspaceChannel } from '@/types/pricing';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface WorkspaceSwitcherProps {
  currentChannel: WorkspaceChannel;
  onChannelChange: (channel: WorkspaceChannel) => void;
  boncosCount: number;
}

export function WorkspaceSwitcher({
  currentChannel,
  onChannelChange,
  boncosCount,
}: WorkspaceSwitcherProps) {
  const isGrab = currentChannel === 'GRABFOOD';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
      {/* Segmented Channel Tab Selector */}
      <div className="w-full sm:w-auto">
        <div className="grid grid-cols-2 sm:inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-300/60 shadow-inner">
          <button
            type="button"
            id="tab-grabfood"
            onClick={() => onChannelChange('GRABFOOD')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isGrab
                ? 'bg-white text-[#00B14F] shadow-xs font-bold ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                isGrab ? 'bg-[#00B14F] ring-2 ring-emerald-500/20' : 'bg-slate-400'
              }`}
            />
            <span className="tracking-tight">GrabFood</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono hidden sm:inline ${
                isGrab
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              Exact Math
            </span>
          </button>

          <button
            type="button"
            id="tab-gofood"
            onClick={() => onChannelChange('GOFOOD')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              !isGrab
                ? 'bg-white text-[#EE2737] shadow-xs font-bold ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                !isGrab ? 'bg-[#EE2737] ring-2 ring-red-500/20' : 'bg-slate-400'
              }`}
            />
            <span className="tracking-tight">GoFood</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono hidden sm:inline ${
                !isGrab
                  ? 'bg-red-50 text-red-800 border border-red-200/80 font-medium'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              Workspace
            </span>
          </button>
        </div>
      </div>

      {/* Meta Information Bar (Responsive on Mobile & Desktop) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {isGrab ? (
          <div className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">Skema Komisi:</span>
            <span className="font-semibold text-slate-800 tabular-nums">20% Layanan</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-800 tabular-nums">+14% Booster</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-slate-500">Skema Komisi:</span>
            <span className="font-semibold text-slate-800 tabular-nums">20% Layanan GoFood</span>
          </div>
        )}

        {boncosCount > 0 ? (
          <div className="flex items-center gap-1.5 font-medium text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-xl px-3 py-1.5 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>
              <strong className="font-semibold tabular-nums">{boncosCount}</strong> menu boncos
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-200/70 rounded-xl px-3 py-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Semua margin aman</span>
          </div>
        )}
      </div>
    </div>
  );
}
