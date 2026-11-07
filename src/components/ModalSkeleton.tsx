import React from 'react';

export interface ModalSkeletonProps {
  type?: 'receipt' | 'form' | 'category' | 'auth' | 'education' | 'profile';
}

export function ModalSkeleton({ type = 'form' }: ModalSkeletonProps) {
  const isSheetMobile = type === 'education';
  const maxWidthClass =
    type === 'education'
      ? 'max-w-4xl rounded-t-2xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[88vh]'
      : type === 'profile'
        ? 'max-w-xl rounded-2xl max-h-[92vh]'
        : type === 'auth'
          ? 'max-w-md rounded-2xl max-h-[92vh]'
          : 'max-w-lg rounded-2xl max-h-[92vh]';

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat jendela dialog..."
      className={`fixed inset-0 z-50 flex justify-center bg-slate-900/55 backdrop-blur-xs animate-modal-backdrop ${
        isSheetMobile
          ? 'items-end sm:items-center p-0 sm:p-4'
          : 'items-center p-3 sm:p-4'
      }`}
    >
      <div
        className={`relative w-full ${maxWidthClass} bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col ${
          isSheetMobile ? 'animate-sheet-panel' : 'animate-modal-panel'
        }`}
      >
        {isSheetMobile && (
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>
        )}

        {/* Header Skeleton */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 sm:w-44 rounded skeleton-shimmer" />
              <div className="h-2.5 w-48 sm:w-56 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg skeleton-shimmer shrink-0" />
        </div>

        {/* Body Skeleton */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {type === 'auth' ? (
            <>
              <div className="h-10 w-full rounded-xl skeleton-shimmer" />
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded skeleton-shimmer" />
                  <div className="h-10 w-full rounded-xl skeleton-shimmer" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded skeleton-shimmer" />
                  <div className="h-10 w-full rounded-xl skeleton-shimmer" />
                </div>
              </div>
              <div className="h-11 w-full rounded-xl skeleton-shimmer mt-2" />
            </>
          ) : type === 'education' ? (
            <>
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded-xl skeleton-shimmer" />
                <div className="h-10 flex-1 rounded-xl skeleton-shimmer" />
                <div className="h-10 flex-1 rounded-xl skeleton-shimmer" />
              </div>
              <div className="h-28 w-full rounded-2xl skeleton-shimmer" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-44 rounded-2xl skeleton-shimmer" />
                <div className="h-44 rounded-2xl skeleton-shimmer" />
              </div>
            </>
          ) : type === 'profile' ? (
            <>
              <div className="flex gap-2">
                <div className="h-9 flex-1 rounded-xl skeleton-shimmer" />
                <div className="h-9 flex-1 rounded-xl skeleton-shimmer" />
                <div className="h-9 flex-1 rounded-xl skeleton-shimmer" />
              </div>
              <div className="space-y-3 pt-1">
                <div className="h-16 w-full rounded-xl skeleton-shimmer" />
                <div className="h-16 w-full rounded-xl skeleton-shimmer" />
                <div className="h-20 w-full rounded-xl skeleton-shimmer" />
              </div>
            </>
          ) : type === 'receipt' ? (
            <>
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
                  <div className="space-y-1">
                    <div className="h-3 w-24 rounded skeleton-shimmer" />
                    <div className="h-3.5 w-32 rounded skeleton-shimmer" />
                  </div>
                </div>
                <div className="h-3 w-16 rounded skeleton-shimmer" />
              </div>
              <div className="h-14 rounded-xl skeleton-shimmer" />
              <div className="space-y-2.5 pt-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1 border-b border-slate-50"
                  >
                    <div className="h-3 w-36 rounded skeleton-shimmer" />
                    <div className="h-3 w-16 rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
              <div className="h-16 rounded-2xl skeleton-shimmer" />
              <div className="h-20 rounded-xl skeleton-shimmer" />
            </>
          ) : type === 'category' ? (
            <>
              <div className="space-y-2">
                <div className="h-3 w-28 rounded skeleton-shimmer" />
                <div className="flex gap-2">
                  <div className="h-9 flex-1 rounded-xl skeleton-shimmer" />
                  <div className="h-9 w-20 rounded-xl skeleton-shimmer" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-11 rounded-xl skeleton-shimmer" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded skeleton-shimmer" />
                  <div className="h-9 w-full rounded-xl skeleton-shimmer" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-20 rounded skeleton-shimmer" />
                  <div className="h-9 w-full rounded-xl skeleton-shimmer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-xl skeleton-shimmer" />
                <div className="h-20 rounded-xl skeleton-shimmer" />
              </div>
              <div className="h-24 rounded-xl skeleton-shimmer" />
            </>
          )}
        </div>

        {/* Footer Skeleton */}
        {type !== 'auth' && (
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
            <div className="h-8 w-28 rounded-xl skeleton-shimmer" />
          </div>
        )}
      </div>
      <span className="sr-only">Sedang memuat dialog...</span>
    </div>
  );
}
