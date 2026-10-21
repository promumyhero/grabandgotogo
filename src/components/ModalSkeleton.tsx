'use client';

import React from 'react';

interface ModalSkeletonProps {
  type?: 'receipt' | 'form' | 'category';
}

export function ModalSkeleton({ type = 'form' }: ModalSkeletonProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-pulse">
        {/* Header Skeleton */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-2.5 w-48 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="w-6 h-6 rounded-lg bg-slate-200" />
        </div>

        {/* Body Skeleton */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {type === 'receipt' ? (
            <>
              {/* Receipt Order Header */}
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200" />
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>

              {/* Menu Card Placeholder */}
              <div className="h-14 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                <div className="h-2.5 w-20 bg-slate-200 rounded" />
                <div className="h-3.5 w-44 bg-slate-200 rounded" />
              </div>

              {/* Receipt Breakdown Lines */}
              <div className="space-y-2.5 pt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-slate-50">
                    <div className="h-3 w-36 bg-slate-100 rounded" />
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>

              {/* Large Highlight Net Payout Card */}
              <div className="h-16 rounded-2xl bg-emerald-50/80 border border-emerald-100 p-4 flex items-center justify-between">
                <div className="h-4 w-36 bg-emerald-200/70 rounded" />
                <div className="h-5 w-24 bg-emerald-200/90 rounded-md" />
              </div>

              {/* Analysis Box */}
              <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
                <div className="h-3 w-40 bg-slate-200 rounded" />
                <div className="h-2.5 w-full bg-slate-100 rounded" />
                <div className="h-2.5 w-3/4 bg-slate-100 rounded" />
              </div>
            </>
          ) : type === 'category' ? (
            <>
              {/* Category Input Box */}
              <div className="space-y-2">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-9 flex-1 bg-slate-100 rounded-xl" />
                  <div className="h-9 w-20 bg-slate-200 rounded-xl" />
                </div>
              </div>

              {/* Category List Rows */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-11 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-24 bg-slate-200 rounded" />
                      <div className="h-4 w-12 bg-slate-100 rounded-md" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-6 h-6 rounded-md bg-slate-200" />
                      <div className="w-6 h-6 rounded-md bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Form 2-Column Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-9 w-full bg-slate-100 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-9 w-full bg-slate-100 rounded-xl" />
                </div>
              </div>

              {/* Price Target Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                  <div className="h-8 w-full bg-slate-200/70 rounded-lg" />
                </div>
                <div className="h-20 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                  <div className="h-8 w-full bg-slate-200/70 rounded-lg" />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="h-24 bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-3">
                <div className="flex justify-between">
                  <div className="h-3.5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="h-7 bg-slate-200/50 rounded" />
                  <div className="h-7 bg-slate-200/50 rounded" />
                  <div className="h-7 bg-slate-200/50 rounded" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Skeleton */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
          <div className="h-8 w-16 bg-slate-200 rounded-xl" />
          <div className="h-8 w-28 bg-slate-300 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
