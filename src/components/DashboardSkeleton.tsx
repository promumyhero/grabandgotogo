'use client';

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen text-slate-900 animate-pulse">
      <div className="space-y-5 sm:space-y-6">
        {/* Top Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 shadow-xs" />
            <div className="space-y-2">
              <div className="h-5 w-60 sm:w-72 bg-slate-200 rounded-lg" />
              <div className="h-3 w-40 sm:w-56 bg-slate-200/70 rounded-md" />
            </div>
          </div>
          <div className="w-36 h-9 rounded-xl bg-slate-200 self-start sm:self-auto" />
        </div>

        {/* Workspace Switcher Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="w-full sm:w-64 h-11 bg-slate-200 rounded-xl" />
          <div className="w-72 h-8 bg-slate-200/70 rounded-xl hidden sm:block" />
        </div>

        {/* 4 KPI Summary Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100" />
              </div>
              <div className="h-7 w-20 bg-slate-200 rounded-md" />
              <div className="h-3 w-full bg-slate-100 rounded pt-1" />
            </div>
          ))}
        </div>

        {/* Global Preset Bar Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-20 h-4 bg-slate-200 rounded" />
            <div className="w-28 h-9 bg-slate-100 rounded-xl" />
            <div className="w-32 h-9 bg-slate-100 rounded-xl" />
            <div className="w-28 h-9 bg-slate-100 rounded-xl" />
            <div className="w-28 h-9 bg-slate-100 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-44 h-9 bg-slate-200 rounded-xl" />
            <div className="w-28 h-9 bg-slate-100 rounded-xl" />
            <div className="w-24 h-9 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Table & Filter Toolbar Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-60 h-9 bg-slate-100 rounded-xl" />
              <div className="w-32 h-9 bg-slate-100 rounded-xl" />
              <div className="w-24 h-9 bg-slate-100 rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-48 h-9 bg-slate-100 rounded-xl" />
              <div className="w-16 h-9 bg-slate-100 rounded-xl" />
              <div className="w-14 h-9 bg-slate-100 rounded-xl" />
              <div className="w-28 h-9 bg-slate-200 rounded-xl" />
            </div>
          </div>

          {/* Desktop Table Rows Skeleton (Hidden on small mobile) */}
          <div className="hidden md:block p-4 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-14 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center justify-between px-4"
              >
                <div className="space-y-1.5">
                  <div className="h-4 w-44 bg-slate-200 rounded" />
                  <div className="h-2.5 w-20 bg-slate-100 rounded" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="h-4 w-18 bg-slate-200 rounded" />
                  <div className="h-4 w-18 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                  <div className="h-6 w-24 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-200" />
                    <div className="w-6 h-6 rounded-lg bg-slate-200" />
                    <div className="w-6 h-6 rounded-lg bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Card Skeleton (Visible on small screens) */}
          <div className="md:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((card) => (
              <div
                key={card}
                className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="h-10 bg-slate-50 rounded-lg" />
                  <div className="h-10 bg-slate-50 rounded-lg" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div className="h-7 w-28 bg-slate-200 rounded-xl" />
                  <div className="flex gap-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-100" />
                    <div className="w-7 h-7 rounded-lg bg-slate-100" />
                    <div className="w-7 h-7 rounded-lg bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
