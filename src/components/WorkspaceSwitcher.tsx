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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      {/* Brand & Tab Selector */}
      <div className="flex items-center gap-3">
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/70 shadow-inner">
          <button
            type="button"
            id="tab-grabfood"
            onClick={() => onChannelChange('GRABFOOD')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              isGrab
                ? 'bg-white text-[#00B14F] shadow-sm font-bold ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isGrab ? 'bg-[#00B14F] shadow-[0_0_8px_#00B14F]' : 'bg-slate-400'
              }`}
            />
            <span className="tracking-tight">GrabFood</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                isGrab
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              Phase 1 (Exact Math)
            </span>
          </button>

          <button
            type="button"
            id="tab-gofood"
            onClick={() => onChannelChange('GOFOOD')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              !isGrab
                ? 'bg-white text-[#EE2737] shadow-sm font-bold ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !isGrab ? 'bg-[#EE2737] shadow-[0_0_8px_#EE2737]' : 'bg-slate-400'
              }`}
            />
            <span className="tracking-tight">GoFood</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                !isGrab
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              Isolated Workspace
            </span>
          </button>
        </div>
      </div>

      {/* Channel Meta Status Pill */}
      <div className="flex items-center gap-2">
        {isGrab ? (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200/90 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">Skema Komisi Grab:</span>
            <span className="font-semibold text-slate-900 tabular-nums">20% Layanan</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-900 tabular-nums">+14% PUAS Booster</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200/90 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span className="font-medium text-slate-700">Skema Komisi GoFood:</span>
            <span className="font-semibold text-slate-900 tabular-nums">20% Standar</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Workspace Terisolasi</span>
          </div>
        )}

        {boncosCount > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>
              <strong className="font-semibold tabular-nums">{boncosCount}</strong> menu boncos
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Semua margin aman</span>
          </div>
        )}
      </div>
    </div>
  );
}
