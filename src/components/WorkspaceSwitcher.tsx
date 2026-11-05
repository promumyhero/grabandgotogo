'use client';

import React, { memo } from 'react';
import { WorkspaceChannel } from '@/types/pricing';

interface WorkspaceSwitcherProps {
  currentChannel: WorkspaceChannel;
  onChannelChange: (channel: WorkspaceChannel) => void;
  boncosCount?: number;
}

export const WorkspaceSwitcher = memo(function WorkspaceSwitcher({
  currentChannel,
  onChannelChange,
}: WorkspaceSwitcherProps) {
  const isGrab = currentChannel === 'GRABFOOD';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Minimalist Segmented Channel Selector */}
      <div
        role="tablist"
        aria-label="Pilih platform delivery"
        className="grid grid-cols-2 sm:inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isGrab}
          id="tab-grabfood"
          onClick={() => onChannelChange('GRABFOOD')}
          className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            isGrab
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isGrab ? 'bg-[#00B14F]' : 'bg-slate-300'
            }`}
          />
          <span>GrabFood</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={!isGrab}
          id="tab-gofood"
          onClick={() => onChannelChange('GOFOOD')}
          className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            !isGrab
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              !isGrab ? 'bg-[#EE2737]' : 'bg-slate-300'
            }`}
          />
          <span>GoFood</span>
        </button>
      </div>

      {/* Subtle Policy Context Line */}
      <div className="text-xs text-slate-500 flex items-center gap-2">
        {isGrab ? (
          <span>
            Formula GrabMerchant · Komisi dasar <strong className="font-semibold text-slate-700 tabular-nums">20%</strong> + opsional PUAS Booster <strong className="font-semibold text-slate-700 tabular-nums">14%</strong>
          </span>
        ) : (
          <span>
            Formula GoBiz · Komisi <strong className="font-semibold text-slate-700 tabular-nums">20% + Rp 800</strong> & co-funding Maksimal PRO
          </span>
        )}
      </div>
    </div>
  );
});
