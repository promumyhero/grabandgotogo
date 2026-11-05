'use client';

import React, { memo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface TablePaginationProps {
  totalItemsCount: number;
  filteredCount: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  safeCurrentPage: number;
  totalPages: number;
  pageNumbers: (number | 'ellipsis')[];
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
}

export const TablePagination = memo(function TablePagination({
  totalItemsCount,
  filteredCount,
  startIndex,
  endIndex,
  itemsPerPage,
  safeCurrentPage,
  totalPages,
  pageNumbers,
  onPageSizeChange,
  onPageChange,
}: TablePaginationProps) {
  return (
    <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col lg:flex-row items-center justify-between gap-3">
      {/* Left: Item Range Info & Page Size Selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full lg:w-auto">
        <div className="text-slate-500 tabular-nums">
          {filteredCount === 0 ? (
            <span>Menampilkan 0 dari {totalItemsCount} menu</span>
          ) : (
            <span>
              Menampilkan{' '}
              <span className="font-semibold text-slate-900">
                {startIndex + 1}–{endIndex}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-slate-900">
                {filteredCount}
              </span>{' '}
              menu
              {filteredCount !== totalItemsCount && (
                <span className="text-slate-400">
                  {' '}
                  (total {totalItemsCount})
                </span>
              )}
            </span>
          )}
        </div>

        <div className="h-3.5 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <label htmlFor="page-size-select" className="text-slate-500">
            Baris:
          </label>
          <select
            id="page-size-select"
            value={itemsPerPage}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Pagination Controls */}
      {filteredCount > 0 && (
        <div className="flex items-center gap-1 self-center lg:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Halaman Pertama"
            aria-label="Halaman Pertama"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1 px-1">
            {pageNumbers.map((page, idx) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-slate-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`min-w-7 h-7 px-2 rounded-md text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                    safeCurrentPage === page
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage === totalPages}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Halaman Berikutnya"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Halaman Terakhir"
            aria-label="Halaman Terakhir"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
});

