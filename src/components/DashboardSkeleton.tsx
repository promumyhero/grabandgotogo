import React from 'react';

export function KpiCardsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat ringkasan margin..."
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-md skeleton-shimmer" />
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg skeleton-shimmer" />
          </div>
          <div className="h-7 w-24 rounded-md skeleton-shimmer" />
          <div className="h-3 w-4/5 rounded-md skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function PricingTableRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat daftar menu..."
      className="w-full"
    >
      {/* Desktop Table Rows Skeleton */}
      <div className="hidden md:block p-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-15 bg-slate-50/60 border border-slate-100 rounded-xl flex items-center justify-between px-4 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-4 h-4 rounded skeleton-shimmer shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-44 rounded skeleton-shimmer" />
                <div className="h-2.5 w-20 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <div className="h-4 w-20 rounded skeleton-shimmer" />
              <div className="h-4 w-16 rounded skeleton-shimmer" />
              <div className="h-5 w-16 rounded-md skeleton-shimmer" />
              <div className="h-7 w-24 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-24 rounded skeleton-shimmer" />
              <div className="flex gap-1.5">
                <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
                <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
                <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {Array.from({ length: Math.min(rows, 3) }).map((_, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1.5">
                <div className="h-4 w-36 rounded skeleton-shimmer" />
                <div className="h-3 w-16 rounded skeleton-shimmer" />
              </div>
              <div className="h-6 w-20 rounded-lg skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div className="h-11 rounded-lg skeleton-shimmer" />
              <div className="h-11 rounded-lg skeleton-shimmer" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <div className="h-7 w-28 rounded-xl skeleton-shimmer" />
              <div className="flex gap-1.5">
                <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
                <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
                <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat halaman aplikasi..."
      className="min-h-screen bg-slate-50/70 text-slate-900"
    >
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {/* Top Minimalist Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-52 sm:w-64 rounded-lg skeleton-shimmer" />
              <div className="h-3 w-40 sm:w-56 rounded-md skeleton-shimmer" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-24 h-9 rounded-xl skeleton-shimmer" />
            <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
            <div className="w-36 h-9 rounded-xl skeleton-shimmer" />
            <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
          </div>
        </div>

        {/* Workspace Switcher Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-64 h-11 rounded-xl skeleton-shimmer" />
          <div className="w-60 h-8 rounded-xl skeleton-shimmer hidden sm:block" />
        </div>

        {/* 4 KPI Summary Cards Skeleton */}
        <KpiCardsSkeleton />

        {/* Global Preset Bar Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-24 h-4 rounded skeleton-shimmer" />
            <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
            <div className="w-32 h-9 rounded-xl skeleton-shimmer" />
            <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
            <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40 h-9 rounded-xl skeleton-shimmer" />
            <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
          </div>
        </div>

        {/* Table & Filter Toolbar Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-60 h-9 rounded-xl skeleton-shimmer" />
              <div className="w-32 h-9 rounded-xl skeleton-shimmer" />
              <div className="w-24 h-9 rounded-xl skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-9 rounded-xl skeleton-shimmer" />
              <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          <PricingTableRowsSkeleton rows={4} />
        </div>
      </div>
      <span className="sr-only">Sedang memuat halaman...</span>
    </div>
  );
}
