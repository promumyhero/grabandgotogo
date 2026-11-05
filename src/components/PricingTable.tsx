'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  CalculationResult,
  MenuItem,
  WorkspaceChannel,
} from '@/types/pricing';
import {
  FoodSuggestion,
  getFoodSuggestions,
  inferCategoryFromMenuName,
} from '@/lib/food-catalog';
import {
  Search,
  Plus,
  Download,
  Upload,
  LayoutGrid,
  List,
  Tags,
  X,
  Utensils,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { PricingTableRow } from '@/components/pricing-table/PricingTableRow';
import { PricingItemCard } from '@/components/pricing-table/PricingItemCard';
import { BulkActionBar } from '@/components/pricing-table/BulkActionBar';
import { TablePagination } from '@/components/pricing-table/TablePagination';

interface PricingTableProps {
  channel: WorkspaceChannel;
  items: MenuItem[];
  calculations: Map<string, CalculationResult>;
  categories: string[];
  onUpdateItem: (id: string, updates: Partial<MenuItem>) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: MenuItem) => void;
  onApplyIdealPrice: (id: string, price: number) => void;
  onBulkDeleteItems: (ids: string[]) => void;
  onBulkApplyIdealPrices: (ids: string[]) => void;
  onBulkUpdateItems: (ids: string[], updates: Partial<MenuItem>, actionLabel: string) => void;
  onOpenReceiptModal: (item: MenuItem) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: MenuItem) => void;
  onOpenCategoryModal: () => void;
  onExportCsv: (selectedItems?: MenuItem[]) => void;
  onImportCsv: (rawCsvText: string) => void;
  highlightedItemId?: string | null;
  isLoading?: boolean;
}

type FilterMode = 'ALL' | 'BONCOS' | 'SAFE';
type SortField = 'DEFAULT' | 'NAME' | 'TARGET_PRICE' | 'DISPLAY_PRICE' | 'NET_PAYOUT' | 'VARIANCE';
type SortDirection = 'asc' | 'desc';

export function PricingTable({
  channel,
  items,
  calculations,
  categories,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onApplyIdealPrice,
  onBulkDeleteItems,
  onBulkApplyIdealPrices,
  onBulkUpdateItems,
  onOpenReceiptModal,
  onOpenAddModal,
  onOpenEditModal,
  onOpenCategoryModal,
  onExportCsv,
  onImportCsv,
  highlightedItemId,
  isLoading,
}: PricingTableProps) {
  const isGrab = channel === 'GRABFOOD';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [sortField, setSortField] = useState<SortField>('DEFAULT');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search Auto-suggest states
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allCategories = useMemo(() => {
    const set = new Set<string>(categories);
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [categories, items]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return getFoodSuggestions(searchQuery, items, allCategories, 5);
  }, [searchQuery, items, allCategories]);

  const matchedCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allCategories.filter((cat) => cat.toLowerCase().includes(q));
  }, [searchQuery, allCategories]);

  const inferredCategory = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return inferCategoryFromMenuName(searchQuery, allCategories);
  }, [searchQuery, allCategories]);

  const handleSelectSearchSuggestion = (sug: FoodSuggestion) => {
    setSearchQuery(sug.name);
    setCurrentPage(1);
    setIsSearchFocused(false);
  };

  const handleSelectCategoryFilter = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentPage(1);
    setIsSearchFocused(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchFocused || searchSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex((prev) => (prev < searchSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (searchSelectedIndex >= 0 && searchSuggestions[searchSelectedIndex]) {
        e.preventDefault();
        handleSelectSearchSuggestion(searchSuggestions[searchSelectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const calc = calculations.get(item.id);

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      if (filterMode === 'BONCOS') {
        return calc ? calc.variance < 0 : false;
      }
      if (filterMode === 'SAFE') {
        return calc ? calc.variance >= 0 : false;
      }

      return true;
    });
  }, [items, calculations, searchQuery, filterMode, selectedCategory]);

  const sortedItems = useMemo(() => {
    if (sortField === 'DEFAULT') return filteredItems;
    const copy = [...filteredItems];
    const dir = sortDirection === 'asc' ? 1 : -1;

    copy.sort((a, b) => {
      const calcA = calculations.get(a.id);
      const calcB = calculations.get(b.id);

      switch (sortField) {
        case 'NAME':
          return a.name.localeCompare(b.name, 'id-ID') * dir;
        case 'TARGET_PRICE':
          return (a.targetOfflinePrice - b.targetOfflinePrice) * dir;
        case 'DISPLAY_PRICE':
          return (a.displayPrice - b.displayPrice) * dir;
        case 'NET_PAYOUT':
          return ((calcA?.netPayout ?? 0) - (calcB?.netPayout ?? 0)) * dir;
        case 'VARIANCE':
          return ((calcA?.variance ?? 0) - (calcB?.variance ?? 0)) * dir;
        default:
          return 0;
      }
    });
    return copy;
  }, [filteredItems, calculations, sortField, sortDirection]);

  const handleSortColumn = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField('DEFAULT');
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedItems.length);

  const paginatedItems = useMemo(() => {
    return sortedItems.slice(startIndex, endIndex);
  }, [sortedItems, startIndex, endIndex]);

  const validIdSet = useMemo(() => new Set(items.map((it) => it.id)), [items]);
  const activeSelectedIds = useMemo(
    () => selectedIds.filter((id) => validIdSet.has(id)),
    [selectedIds, validIdSet]
  );
  const activeSelectedSet = useMemo(() => new Set(activeSelectedIds), [activeSelectedIds]);

  const isAllPageSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((it) => activeSelectedSet.has(it.id));

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectPage = () => {
    const pageIds = paginatedItems.map((it) => it.id);
    if (isAllPageSelected) {
      const pageSet = new Set(pageIds);
      setSelectedIds((prev) => prev.filter((id) => !pageSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(sortedItems.map((it) => it.id));
  }, [sortedItems]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        onImportCsv(text);
        setCurrentPage(1);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [safeCurrentPage, totalPages]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-slate-900 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-900 shrink-0" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden relative">
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-900 animate-pulse z-10" />
      )}

      {/* Top Table Control Toolbar */}
      <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Filter Segmented Pills & Category / Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 text-xs font-medium">
            <button
              type="button"
              id="filter-all"
              onClick={() => {
                setFilterMode('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer tabular-nums ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              id="filter-boncos"
              onClick={() => {
                setFilterMode('BONCOS');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums ${
                filterMode === 'BONCOS'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Defisit ({counts.boncos})</span>
            </button>
            <button
              type="button"
              id="filter-safe"
              onClick={() => {
                setFilterMode('SAFE');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums ${
                filterMode === 'SAFE'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Aman ({counts.safe})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              aria-label="Filter kategori menu"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {selectedCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Hapus filter kategori"
              >
                <span>{selectedCategory}</span>
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}

            <select
              aria-label="Urutkan daftar menu"
              value={`${sortField}:${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split(':') as [SortField, SortDirection];
                setSortField(f);
                setSortDirection(d || 'asc');
                setCurrentPage(1);
              }}
              className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="DEFAULT:asc">Urutan: Default</option>
              <option value="VARIANCE:asc">Urut: Defisit Terbesar</option>
              <option value="VARIANCE:desc">Urut: Surplus Tertinggi</option>
              <option value="DISPLAY_PRICE:asc">Urut: Harga Termurah</option>
              <option value="DISPLAY_PRICE:desc">Urut: Harga Termahal</option>
              <option value="NET_PAYOUT:desc">Urut: Payout Tertinggi</option>
              <option value="NAME:asc">Urut: Nama A–Z</option>
              <option value="NAME:desc">Urut: Nama Z–A</option>
            </select>

            <button
              type="button"
              id="btn-manage-categories"
              onClick={onOpenCategoryModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Kelola kategori menu"
            >
              <Tags className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Kategori</span>
            </button>
          </div>
        </div>

        {/* Right: Search Bar & Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-56" ref={searchDropdownRef}>
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="search-input"
              aria-label="Cari menu"
              placeholder="Cari menu atau kategori..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setIsSearchFocused(true);
                setSearchSelectedIndex(-1);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full text-xs font-medium pl-8 pr-7 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  setSearchSelectedIndex(-1);
                }}
                className="absolute right-2 top-1.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Floating Search Autocomplete */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-30 w-72 sm:w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                {(inferredCategory || matchedCategories.length > 0) && (
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Filter Kategori</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {inferredCategory && (
                        <button
                          type="button"
                          onClick={() => handleSelectCategoryFilter(inferredCategory)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            selectedCategory === inferredCategory
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{inferredCategory}</span>
                        </button>
                      )}
                      {matchedCategories
                        .filter((cat) => cat !== inferredCategory)
                        .map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleSelectCategoryFilter(cat)}
                            className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              selectedCategory === cat
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {searchSuggestions.length > 0 ? (
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {searchSuggestions.map((sug, idx) => (
                      <div
                        key={`${sug.name}-${idx}`}
                        onClick={() => handleSelectSearchSuggestion(sug)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                          searchSelectedIndex === idx ? 'bg-slate-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Utensils className="w-3 h-3 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {sug.name}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCategoryFilter(sug.category);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                        >
                          {sug.category}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Menampilkan hasil pencarian teks langsung.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
              aria-label="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu"
              aria-label="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFileChange}
            className="hidden"
          />

          <button
            type="button"
            id="btn-import-csv"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Impor daftar menu dari CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Impor</span>
          </button>

          <button
            type="button"
            id="btn-export-csv"
            onClick={() => onExportCsv()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Ekspor ke CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            type="button"
            id="btn-add-menu"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah Menu</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* Contextual Bulk Action Bar */}
      <BulkActionBar
        isGrab={isGrab}
        selectedCount={activeSelectedIds.length}
        totalFilteredCount={sortedItems.length}
        allCategories={allCategories}
        onSelectAllFiltered={selectAllFiltered}
        onClearSelection={clearSelection}
        onBulkApplyIdealPrices={() => {
          onBulkApplyIdealPrices(activeSelectedIds);
          clearSelection();
        }}
        onBulkUpdateItems={(updates, label) => {
          onBulkUpdateItems(activeSelectedIds, updates, label);
          clearSelection();
        }}
        onExportSelectedCsv={() => {
          const selectedMenuObjects = items.filter((it) => activeSelectedSet.has(it.id));
          onExportCsv(selectedMenuObjects);
        }}
        onBulkDelete={() => {
          onBulkDeleteItems(activeSelectedIds);
          clearSelection();
        }}
      />

      {/* VIEW A: Card Grid View */}
      <div className={`${viewMode === 'cards' ? 'block' : 'hidden md:hidden'} p-4`}>
        {sortedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            Tidak ada menu yang sesuai dengan filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {paginatedItems.map((item) => (
              <PricingItemCard
                key={`card-${item.id}`}
                item={item}
                calc={calculations.get(item.id)}
                isSelected={activeSelectedSet.has(item.id)}
                isHighlighted={item.id === highlightedItemId}
                onToggleSelect={toggleSelectOne}
                onUpdateItem={onUpdateItem}
                onApplyIdealPrice={onApplyIdealPrice}
                onOpenEditModal={onOpenEditModal}
                onOpenReceiptModal={onOpenReceiptModal}
                onDuplicateItem={onDuplicateItem}
                onDeleteItem={onDeleteItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* VIEW B: High-Density Table View */}
      <div className={`${viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 text-slate-500 font-medium text-[11px] uppercase tracking-wider border-b border-slate-200/80">
              <th scope="col" className="pl-4 pr-2 py-3 w-9 text-center">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleSelectPage}
                  disabled={paginatedItems.length === 0}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer disabled:opacity-40"
                  title="Pilih semua menu di halaman ini"
                  aria-label="Pilih semua menu di halaman ini"
                />
              </th>
              <th scope="col" className="px-3 py-3 whitespace-nowrap text-left min-w-50">
                <button
                  type="button"
                  onClick={() => handleSortColumn('NAME')}
                  className="group inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer uppercase"
                >
                  <span>Menu</span>
                  {renderSortIcon('NAME')}
                </button>
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-right min-w-30">
                <button
                  type="button"
                  onClick={() => handleSortColumn('TARGET_PRICE')}
                  className="group inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer ml-auto uppercase"
                >
                  <span>Target Offline</span>
                  {renderSortIcon('TARGET_PRICE')}
                </button>
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-right min-w-32.5">
                <button
                  type="button"
                  onClick={() => handleSortColumn('DISPLAY_PRICE')}
                  className="group inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer ml-auto uppercase"
                >
                  <span>Harga App</span>
                  {renderSortIcon('DISPLAY_PRICE')}
                </button>
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-right min-w-32.5">
                {isGrab ? 'Diskon Mitra' : 'Promo'}
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-center min-w-28">
                {isGrab ? 'Booster' : 'Subsidi'}
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-right min-w-30">
                Potongan
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-right min-w-30">
                <button
                  type="button"
                  onClick={() => handleSortColumn('NET_PAYOUT')}
                  className="group inline-flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer ml-auto uppercase"
                >
                  <span>Net Payout</span>
                  {renderSortIcon('NET_PAYOUT')}
                </button>
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-center min-w-30">
                <button
                  type="button"
                  onClick={() => handleSortColumn('VARIANCE')}
                  className="group inline-flex items-center justify-center gap-1 hover:text-slate-900 cursor-pointer mx-auto uppercase"
                >
                  <span>Selisih</span>
                  {renderSortIcon('VARIANCE')}
                </button>
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-right min-w-40">
                Harga Ideal
              </th>
              <th scope="col" className="px-3.5 py-3 whitespace-nowrap text-center min-w-28">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-12 text-center text-slate-400 font-medium"
                >
                  Tidak ada menu yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <PricingTableRow
                  key={item.id}
                  item={item}
                  calc={calculations.get(item.id)}
                  isGrab={isGrab}
                  isSelected={activeSelectedSet.has(item.id)}
                  isHighlighted={item.id === highlightedItemId}
                  onToggleSelect={toggleSelectOne}
                  onUpdateItem={onUpdateItem}
                  onApplyIdealPrice={onApplyIdealPrice}
                  onOpenEditModal={onOpenEditModal}
                  onOpenReceiptModal={onOpenReceiptModal}
                  onDuplicateItem={onDuplicateItem}
                  onDeleteItem={onDeleteItem}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer & Pagination */}
      <TablePagination
        totalItemsCount={items.length}
        filteredCount={filteredItems.length}
        startIndex={startIndex}
        endIndex={endIndex}
        itemsPerPage={itemsPerPage}
        safeCurrentPage={safeCurrentPage}
        totalPages={totalPages}
        pageNumbers={pageNumbers}
        onPageSizeChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
