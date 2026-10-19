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
} from 'lucide-react';

interface PricingTableProps {
  channel: WorkspaceChannel;
  items: MenuItem[];
  calculations: Map<string, CalculationResult>;
  onUpdateItem: (id: string, updates: Partial<MenuItem>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: MenuItem) => void;
  onApplyIdealPrice: (id: string, price: number) => void;
  onOpenReceiptModal: (item: MenuItem) => void;
  onOpenAddModal: () => void;
  onExportCsv: () => void;
}

type FilterMode = 'ALL' | 'BONCOS' | 'SAFE';

export function PricingTable({
  channel,
  items,
  calculations,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onApplyIdealPrice,
  onOpenReceiptModal,
  onOpenAddModal,
  onExportCsv,
}: PricingTableProps) {
  const isGrab = channel === 'GRABFOOD';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [items]);

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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Table Control Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              id="filter-all"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Menu ({counts.all})
            </button>
            <button
              type="button"
              id="filter-boncos"
              onClick={() => setFilterMode('BONCOS')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'BONCOS'
                  ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold border border-rose-200/80'
                  : 'text-rose-600 hover:text-rose-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Menu Boncos ({counts.boncos})</span>
            </button>
            <button
              type="button"
              id="filter-safe"
              onClick={() => setFilterMode('SAFE')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'SAFE'
                  ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold border border-emerald-200/80'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Menu Aman ({counts.safe})</span>
            </button>
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Search Bar & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-50">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              id="search-input"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Export CSV */}
          <button
            type="button"
            id="btn-export-csv"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Download CSV rincian harga dan margin"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Menu Button */}
          <button
            type="button"
            id="btn-add-menu"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-left min-w-50">
                Menu & Kategori
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-right min-w-32.5">
                Target Offline
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-right min-w-32.5">
                Harga Jual App
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-right min-w-35">
                Diskon Mitra
              </th>
              {isGrab && (
                <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-center min-w-32.5">
                  PUAS Booster (14%)
                </th>
              )}
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-right min-w-32.5">
                Potongan Platform
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-right min-w-32.5">
                Net Payout
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-center min-w-35">
                Status / Selisih
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-right min-w-42.5">
                Harga Ideal Rekomendasi
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200 text-center min-w-30">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={isGrab ? 10 : 9}
                  className="px-4 py-12 text-center text-slate-400 font-medium"
                >
                  Tidak ada menu yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const calc = calculations.get(item.id);
                const isBoncos = calc ? calc.variance < 0 : false;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isBoncos ? 'bg-rose-50/25' : ''
                    }`}
                  >
                    {/* 1. Menu Name & Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-left">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-medium">
                          {item.category || 'Menu'}
                        </span>
                        {item.notes && (
                          <span
                            className="text-slate-400 truncate max-w-37.5"
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
                          className="w-20 text-right font-semibold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-0.5 tabular-nums focus:outline-none"
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
                          className={`w-20 text-right font-bold bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-0.5 tabular-nums focus:outline-none ${
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
                          className="text-[10px] font-bold px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
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
                          className="w-16 text-right font-medium text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-0.5 tabular-nums focus:outline-none"
                        />
                      </div>
                      {calc && (
                        <div className="text-[10px] text-rose-500 font-mono mt-0.5 tabular-nums">
                          -{formatRupiah(calc.discountAmount)}
                        </div>
                      )}
                    </td>

                    {/* 5. PUAS Booster Switch (GrabFood Only) */}
                    {isGrab && (
                      <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItem(item.id, {
                              isBoosterActive: !item.isBoosterActive,
                            })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            item.isBoosterActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
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
                    )}

                    {/* 6. Total Platform Deduction */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div className="font-semibold text-slate-800 tabular-nums">
                        {calc ? formatRupiah(calc.totalPlatformDeduction) : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {calc ? `${calc.effectiveCommissionRatePct}% cut` : ''}
                      </div>
                    </td>

                    {/* 7. Net Payout */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          isBoncos ? 'text-rose-700' : 'text-slate-900'
                        }`}
                      >
                        {calc ? formatRupiah(calc.netPayout) : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {calc ? `${calc.effectiveMerchantMarginPct}% margin` : ''}
                      </div>
                    </td>

                    {/* 8. Status Badge & Variance vs Target */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-center">
                      {calc && (
                        <div
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold tabular-nums ${
                            isBoncos
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isBoncos ? (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          )}
                          <span>
                            {formatRupiah(calc.variance, true)}{' '}
                            <span className="text-[10px] font-medium">
                              {isBoncos ? 'Boncos' : 'Aman'}
                            </span>
                          </span>
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
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
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
                        {/* Simulation Receipt Modal */}
                        <button
                          type="button"
                          onClick={() => onOpenReceiptModal(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Lihat simulasi struk settlement GrabMerchant"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => onDuplicateItem(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          title="Duplikat menu ini"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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
      <div className="p-4 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">Tips Operasional:</span>
          <span>
            Semua input harga offline dan harga jual dapat langsung diedit di baris tabel dengan hasil realtime.
          </span>
        </div>
        <div className="text-slate-400 tabular-nums">
          Menampilkan {filteredItems.length} dari {items.length} menu
        </div>
      </div>
    </div>
  );
}
