'use client';

import React, { useState, useMemo } from 'react';
import {
  CalculationResult,
  MenuItem,
  WorkspaceChannel,
} from '@/types/pricing';
import { formatRupiah } from '@/lib/pricing-engine';
import {
  Search,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  List,
  Pencil,
  Tags,
} from 'lucide-react';

interface PricingTableProps {
  channel: WorkspaceChannel;
  items: MenuItem[];
  calculations: Map<string, CalculationResult>;
  categories: string[];
  onUpdateItem: (id: string, updates: Partial<MenuItem>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: MenuItem) => void;
  onApplyIdealPrice: (id: string, price: number) => void;
  onOpenReceiptModal: (item: MenuItem) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: MenuItem) => void;
  onOpenCategoryModal: () => void;
  onExportCsv: () => void;
  highlightedItemId?: string | null;
  isLoading?: boolean;
}

type FilterMode = 'ALL' | 'BONCOS' | 'SAFE';

export function PricingTable({
  channel,
  items,
  calculations,
  categories,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onApplyIdealPrice,
  onOpenReceiptModal,
  onOpenAddModal,
  onOpenEditModal,
  onOpenCategoryModal,
  onExportCsv,
  highlightedItemId,
  isLoading,
}: PricingTableProps) {
  const isGrab = channel === 'GRABFOOD';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Categories list combining managed categories + item categories
  const allCategories = useMemo(() => {
    const set = new Set<string>(categories);
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [categories, items]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let boncos = 0;
    let safe = 0;
    items.forEach((item) => {
      const calc = calculations.get(item.id);
      if (calc?.variance && calc.variance < 0) {
        boncos++;
      } else {
        safe++;
      }
    });
    return { all: items.length, boncos, safe };
  }, [items, calculations]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const calc = calculations.get(item.id);

      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      // Filter by Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Filter by Status Tab
      if (filterMode === 'BONCOS') {
        return calc ? calc.variance < 0 : false;
      }
      if (filterMode === 'SAFE') {
        return calc ? calc.variance >= 0 : false;
      }

      return true;
    });
  }, [items, calculations, searchQuery, filterMode, selectedCategory]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden relative">
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse z-10" />
      )}
      {/* Top Table Control Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Left: Filter Segmented Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              id="filter-all"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              id="filter-boncos"
              onClick={() => setFilterMode('BONCOS')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'BONCOS'
                  ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold ring-1 ring-rose-200/60'
                  : 'text-rose-600 hover:text-rose-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Boncos ({counts.boncos})</span>
            </button>
            <button
              type="button"
              id="filter-safe"
              onClick={() => setFilterMode('SAFE')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'SAFE'
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-200/60'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Aman ({counts.safe})</span>
            </button>
          </div>

          {/* Category Dropdown & Manage Categories Button */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              id="btn-manage-categories"
              onClick={onOpenCategoryModal}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
              title="Kelola, tambah, atau ubah nama kategori menu"
            >
              <Tags className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Kategori</span>
            </button>
          </div>
        </div>

        {/* Right: Search Bar & Actions */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              id="search-input"
              placeholder="Cari nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* View Mode Switcher (Grid/Cards vs Table) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel (Desktop)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu (Mobile / Tablet)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            id="btn-export-csv"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Download CSV rincian harga dan margin"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Add Menu Button */}
          <button
            type="button"
            id="btn-add-menu"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah Menu</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* VIEW A: Mobile / Tablet Card View (shows automatically when viewMode === 'cards' or on mobile devices) */}
      <div className={`${viewMode === 'cards' ? 'block' : 'hidden md:hidden'} p-4 divide-y divide-slate-100`}>
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            Tidak ada menu yang sesuai dengan filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const calc = calculations.get(item.id);
              const isBoncos = calc ? calc.variance < 0 : false;
              const isHighlighted = item.id === highlightedItemId;

              return (
                <div
                  key={`card-${item.id}`}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isHighlighted
                      ? 'ring-2 ring-emerald-500 bg-emerald-50/70 shadow-sm scale-[1.01]'
                      : isBoncos
                      ? 'bg-rose-50/30 border-rose-200/80'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                      <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 text-slate-600 font-medium text-[11px] rounded-md">
                        {item.category || 'Menu'}
                      </span>
                    </div>

                    {calc && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums shrink-0 ${
                          isBoncos
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isBoncos ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>{formatRupiah(calc.variance, true)}</span>
                      </span>
                    )}
                  </div>

                  {/* Card Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 py-3 text-xs border-b border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Target Offline</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Rp</span>
                        <input
                          type="number"
                          step="500"
                          value={item.targetOfflinePrice}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              targetOfflinePrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24 font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Harga Jual App</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Rp</span>
                        <input
                          type="number"
                          step="500"
                          value={item.displayPrice}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              displayPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24 font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Net Payout Bersih</span>
                      <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                        {calc ? formatRupiah(calc.netPayout) : '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Potongan Platform</span>
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">
                        {calc ? formatRupiah(calc.totalPlatformDeduction) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Card Ideal Price Recommendation & Actions */}
                  <div className="pt-3 flex items-center justify-between gap-2">
                    {calc && isBoncos ? (
                      <button
                        type="button"
                        onClick={() =>
                          onApplyIdealPrice(item.id, calc.recommendedDisplayPriceRounded)
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pakai {formatRupiah(calc.recommendedDisplayPriceRounded)}</span>
                      </button>
                    ) : (
                      <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Margin Aman</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit rincian menu ini"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenReceiptModal(item)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Lihat Struk"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateItem(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Duplikat"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW B: High-Density Table View (Desktop & Tablet) */}
      <div className={`${viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-semibold text-xs border-b border-slate-200/80">
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-left min-w-50">
                Menu & Kategori
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-32.5">
                Target Offline
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-32.5">
                Harga Jual App
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-35">
                {isGrab ? 'Diskon Mitra' : 'Promo Konsumen'}
              </th>
              {isGrab ? (
                <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-center min-w-32.5">
                  PUAS Booster (14%)
                </th>
              ) : (
                <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-center min-w-32.5">
                  Subsidi Gojek
                </th>
              )}
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-32.5">
                {isGrab ? 'Potongan Grab' : 'Total Potongan'}
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-32.5">
                Net Payout
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-center min-w-35">
                Status / Selisih
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-42.5">
                Harga Ideal Rekomendasi
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-center min-w-30">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-slate-400 font-medium"
                >
                  Tidak ada menu yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const calc = calculations.get(item.id);
                const isBoncos = calc ? calc.variance < 0 : false;
                const isHighlighted = item.id === highlightedItemId;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-200 ${
                      isHighlighted
                        ? 'bg-emerald-50/80 ring-2 ring-emerald-400/80 ring-inset'
                        : isBoncos
                        ? 'bg-rose-50/20 hover:bg-rose-50/40'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* 1. Menu Name & Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-left">
                      <div className="font-bold text-slate-900 tracking-tight">{item.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-medium">
                          {item.category || 'Menu'}
                        </span>
                        {item.notes && (
                          <span
                            className="text-slate-400 truncate max-w-37.5 font-normal"
                            title={item.notes}
                          >
                            • {item.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Target Offline Price (Editable Inline) */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="number"
                          step="500"
                          value={item.targetOfflinePrice}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              targetOfflinePrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 text-right font-bold text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 tabular-nums focus:outline-none transition-colors"
                        />
                      </div>
                    </td>

                    {/* 3. Display Price (Editable Inline) */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="number"
                          step="500"
                          value={item.displayPrice}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              displayPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`w-20 text-right font-bold bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 tabular-nums focus:outline-none transition-colors ${
                            isBoncos ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        />
                      </div>
                    </td>

                    {/* 4. Merchant Discount Type & Value */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItem(item.id, {
                              merchantDiscountType:
                                item.merchantDiscountType === 'PERCENT'
                                  ? 'NOMINAL'
                                  : 'PERCENT',
                            })
                          }
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title="Klik untuk beralih antara % dan Rp"
                        >
                          {item.merchantDiscountType === 'PERCENT' ? '%' : 'Rp'}
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.merchantDiscountValue}
                          onChange={(e) =>
                            onUpdateItem(item.id, {
                              merchantDiscountValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 text-right font-semibold text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 tabular-nums focus:outline-none transition-colors"
                        />
                      </div>
                      {calc && (
                        <div className="text-[11px] text-rose-500 font-mono mt-0.5 tabular-nums">
                          -{formatRupiah(calc.discountAmount)}
                        </div>
                      )}
                    </td>

                    {/* 5. Booster (Grab) or Subsidi Promo (GoFood) */}
                    {isGrab ? (
                      <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItem(item.id, {
                              isBoosterActive: !item.isBoosterActive,
                            })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            item.isBoosterActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                              : 'bg-slate-100 text-slate-400 border border-slate-200/70'
                          }`}
                          title={
                            item.isBoosterActive
                              ? 'Booster Aktif: Grab mengenakan +14% Biaya Sukses Pemasaran'
                              : 'Booster Nonaktif: Biaya Sukses Pemasaran Rp 0'
                          }
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isBoosterActive ? 'bg-[#00B14F]' : 'bg-slate-300'
                            }`}
                          />
                          <span>{item.isBoosterActive ? 'Aktif (14%)' : 'OFF'}</span>
                        </button>
                      </td>
                    ) : (
                      <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const current = item.gojekSubsidyPct ?? 25;
                            const next = current === 25 ? 30 : current === 30 ? 0 : 25;
                            onUpdateItem(item.id, { gojekSubsidyPct: next });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Klik untuk ubah skema subsidi Gojek (25% / 30% / 0%)"
                        >
                          <span>Disubsidi {item.gojekSubsidyPct ?? 25}%</span>
                        </button>
                      </td>
                    )}

                    {/* 6. Total Platform Deduction */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div className="font-semibold text-slate-800 tabular-nums">
                        {calc ? formatRupiah(calc.totalPlatformDeduction) : '-'}
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        {calc ? `${calc.effectiveCommissionRatePct}% cut` : ''}
                      </div>
                    </td>

                    {/* 7. Net Payout */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div
                        className={`text-sm font-extrabold tabular-nums tracking-tight ${
                          isBoncos ? 'text-rose-700' : 'text-slate-900'
                        }`}
                      >
                        {calc ? formatRupiah(calc.netPayout) : '-'}
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        {calc ? `${calc.effectiveMerchantMarginPct}% margin` : ''}
                      </div>
                    </td>

                    {/* 8. Status Badge & Variance vs Target */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-center">
                      {calc && (
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                            isBoncos
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                          }`}
                        >
                          {isBoncos ? (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          )}
                          <span>{formatRupiah(calc.variance, true)}</span>
                        </div>
                      )}
                    </td>

                    {/* 9. Recommended Display Price & 1-Click Apply */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      {calc && (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="text-right">
                            <div className="font-bold text-emerald-700 tabular-nums text-xs">
                              {formatRupiah(calc.recommendedDisplayPriceRounded)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              min: {formatRupiah(calc.recommendedDisplayPriceExact)}
                            </div>
                          </div>
                          {calc.variance < 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                onApplyIdealPrice(
                                  item.id,
                                  calc.recommendedDisplayPriceRounded
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                              title="Terapkan harga ideal ini untuk menghapus defisit boncos"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Pakai</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 10. Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Menu */}
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit rincian & formula menu ini"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Simulation Receipt Modal */}
                        <button
                          type="button"
                          onClick={() => onOpenReceiptModal(item)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isGrab
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-rose-700 hover:bg-rose-50'
                          }`}
                          title={
                            isGrab
                              ? 'Lihat simulasi struk settlement GrabMerchant'
                              : 'Lihat simulasi struk settlement GoFood'
                          }
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => onDuplicateItem(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Duplikat menu ini"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="font-semibold text-slate-700">Operasional:</span>
          <span>
            Input harga offline dan harga jual dapat langsung diedit di baris tabel dengan sinkronisasi realtime.
          </span>
        </div>
        <div className="text-slate-400 tabular-nums">
          Menampilkan {filteredItems.length} dari {items.length} menu
        </div>
      </div>
    </div>
  );
}
