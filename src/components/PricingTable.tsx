'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CalculationResult,
  MenuItem,
  WorkspaceChannel,
} from '@/types/pricing';
import { formatRupiah } from '@/lib/pricing-engine';
import {
  FoodSuggestion,
  getFoodSuggestions,
  inferCategoryFromMenuName,
} from '@/lib/food-catalog';
import {
  sanitizeNumericInput,
  handleNumberInputFocus,
} from '@/lib/input-utils';
import {
  Search,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  Copy,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  List,
  Pencil,
  Tags,
  X,
  Utensils,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categories list combining managed categories + item categories
  const allCategories = useMemo(() => {
    const set = new Set<string>(categories);
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [categories, items]);

  // Food suggestions based on current search input
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return getFoodSuggestions(searchQuery, items, allCategories, 5);
  }, [searchQuery, items, allCategories]);

  // Detected matching categories from search query
  const matchedCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allCategories.filter((cat) => cat.toLowerCase().includes(q));
  }, [searchQuery, allCategories]);

  // Inferred category from query keywords (e.g. "nasi rames" -> "Paket Nasi")
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

  // Sorted Items
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
      // For VARIANCE, default to 'asc' so largest deficit (most boncos) comes first!
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedItems.length);

  const paginatedItems = useMemo(() => {
    return sortedItems.slice(startIndex, endIndex);
  }, [sortedItems, startIndex, endIndex]);

  // Selection logic (auto-cleaned against existing items)
  const validIdSet = useMemo(() => new Set(items.map((it) => it.id)), [items]);
  const activeSelectedIds = useMemo(
    () => selectedIds.filter((id) => validIdSet.has(id)),
    [selectedIds, validIdSet]
  );
  const activeSelectedSet = useMemo(() => new Set(activeSelectedIds), [activeSelectedIds]);

  const isAllPageSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((it) => activeSelectedSet.has(it.id));

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectPage = () => {
    const pageIds = paginatedItems.map((it) => it.id);
    if (isAllPageSelected) {
      const pageSet = new Set(pageIds);
      setSelectedIds((prev) => prev.filter((id) => !pageSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(sortedItems.map((it) => it.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

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
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-600 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-600 shrink-0" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden relative">
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse z-10" />
      )}
      {/* Top Table Control Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Left: Filter Segmented Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              id="filter-all"
              onClick={() => {
                setFilterMode('ALL');
                setCurrentPage(1);
              }}
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
              onClick={() => {
                setFilterMode('BONCOS');
                setCurrentPage(1);
              }}
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
              onClick={() => {
                setFilterMode('SAFE');
                setCurrentPage(1);
              }}
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

          {/* Category Dropdown, Sort Selector & Manage Categories Button */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
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
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Hapus filter kategori ini"
              >
                <span>{selectedCategory}</span>
                <X className="w-3 h-3 text-emerald-600" />
              </button>
            )}

            {/* Quick Sort Dropdown (works on both Desktop & Mobile Card View) */}
            <select
              value={`${sortField}:${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split(':') as [SortField, SortDirection];
                setSortField(f);
                setSortDirection(d || 'asc');
                setCurrentPage(1);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              title="Urutkan daftar menu"
            >
              <option value="DEFAULT:asc">Urutan: Default</option>
              <option value="VARIANCE:asc">Urut: Paling Boncos</option>
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
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
              title="Kelola, tambah, atau ubah nama kategori menu"
            >
              <Tags className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Kategori</span>
            </button>
          </div>
        </div>

        {/* Right: Search Bar & Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Box with Autocomplete & Category Linking */}
          <div className="relative flex-1 sm:w-60" ref={searchDropdownRef}>
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              id="search-input"
              placeholder="Cari menu, contoh: nasi rames..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setIsSearchFocused(true);
                setSearchSelectedIndex(-1);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full text-xs font-medium pl-8 pr-7 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  setSearchSelectedIndex(-1);
                }}
                className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Floating Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-30 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {/* 1. Category Link Recommendations */}
                {(inferredCategory || matchedCategories.length > 0) && (
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Kategori Terkait</span>
                      <span className="text-[9px] text-emerald-600 font-normal">Klik untuk filter</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {inferredCategory && (
                        <button
                          type="button"
                          onClick={() => handleSelectCategoryFilter(inferredCategory)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            selectedCategory === inferredCategory
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
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
                            className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              selectedCategory === cat
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. Menu Suggestions */}
                {searchSuggestions.length > 0 ? (
                  <div>
                    <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <span>Rekomendasi Menu</span>
                      <span className="text-[9px] text-slate-400 normal-case">Pilih untuk isi pencarian</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {searchSuggestions.map((sug, idx) => (
                        <div
                          key={`${sug.name}-${idx}`}
                          onClick={() => handleSelectSearchSuggestion(sug)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-emerald-50/70 transition-colors cursor-pointer ${
                            searchSelectedIndex === idx ? 'bg-emerald-50 ring-1 ring-emerald-400 ring-inset' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                              <Utensils className="w-3 h-3" />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {sug.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {sug.source === 'existing' ? 'Menu di resto Anda' : 'Katalog F&B Indonesia'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCategoryFilter(sug.category);
                              }}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
                              title={`Filter langsung kategori ${sug.category}`}
                            >
                              {sug.category}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Tidak ada menu spesifik di katalog. Menampilkan hasil pencarian teks langsung.
                  </div>
                )}
              </div>
            )}
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

          {/* Hidden File Input for CSV Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFileChange}
            className="hidden"
          />

          {/* Import CSV */}
          <button
            type="button"
            id="btn-import-csv"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Impor daftar menu dari file CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">Impor</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            id="btn-export-csv"
            onClick={() => onExportCsv()}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
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

      {/* Contextual Bulk Action Bar (Visible when items are selected) */}
      {activeSelectedIds.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              <span>{activeSelectedIds.length} menu dipilih</span>
            </span>

            {activeSelectedIds.length < sortedItems.length && (
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-[11px] font-semibold text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Pilih semua ({sortedItems.length} menu)
              </button>
            )}

            <button
              type="button"
              onClick={clearSelection}
              className="text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              Batal pilih
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Bulk Apply Ideal Prices */}
            <button
              type="button"
              onClick={() => {
                onBulkApplyIdealPrices(activeSelectedIds);
                clearSelection();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer"
              title="Terapkan Harga Ideal hanya pada menu yang dicentang"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Terapkan Harga Ideal</span>
            </button>

            {/* Bulk Booster (Grab) or Subsidy (GoFood) */}
            {isGrab ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onBulkUpdateItems(
                      activeSelectedIds,
                      { isBoosterActive: true },
                      'Aktifkan PUAS Booster'
                    );
                    clearSelection();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Booster ON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBulkUpdateItems(
                      activeSelectedIds,
                      { isBoosterActive: false },
                      'Matikan PUAS Booster'
                    );
                    clearSelection();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Booster OFF
                </button>
              </>
            ) : (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const pct = Number(e.target.value);
                  onBulkUpdateItems(
                    activeSelectedIds,
                    { gojekSubsidyPct: pct },
                    `Set Subsidi Gojek ${pct}%`
                  );
                  clearSelection();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="" disabled>
                  Ubah Subsidi...
                </option>
                <option value="25">Subsidi 25%</option>
                <option value="30">Subsidi 30%</option>
                <option value="0">Subsidi 0%</option>
              </select>
            )}

            {/* Bulk Move Category */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                onBulkUpdateItems(
                  activeSelectedIds,
                  { category: e.target.value },
                  `Pindah ke kategori "${e.target.value}"`
                );
                clearSelection();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="" disabled>
                Pindah Kategori...
              </option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Export Selected CSV */}
            <button
              type="button"
              onClick={() => {
                const selectedMenuObjects = items.filter((it) => activeSelectedSet.has(it.id));
                onExportCsv(selectedMenuObjects);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Download CSV untuk menu yang dicentang saja"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV Terpilih</span>
            </button>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={() => {
                onBulkDeleteItems(activeSelectedIds);
                clearSelection();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
              title="Hapus semua menu yang dicentang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({activeSelectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW A: Mobile / Tablet Card View (shows automatically when viewMode === 'cards' or on mobile devices) */}
      <div className={`${viewMode === 'cards' ? 'block' : 'hidden md:hidden'} p-4 divide-y divide-slate-100`}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
            {[1, 2].map((idx) => (
              <div
                key={`card-skeleton-${idx}`}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            Tidak ada menu yang sesuai dengan filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedItems.map((item) => {
              const calc = calculations.get(item.id);
              const isBoncos = calc ? calc.variance < 0 : false;
              const isHighlighted = item.id === highlightedItemId;
              const isSelected = activeSelectedSet.has(item.id);

              return (
                <div
                  key={`card-${item.id}`}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isHighlighted
                      ? 'ring-2 ring-emerald-500 bg-emerald-50/70 shadow-sm scale-[1.01]'
                      : isSelected
                      ? 'ring-2 ring-slate-900 bg-slate-50/60 border-slate-300'
                      : isBoncos
                      ? 'bg-rose-50/30 border-rose-200/80'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(item.id)}
                        className="mt-1 w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        aria-label={`Pilih ${item.name}`}
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                        <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 text-slate-600 font-medium text-[11px] rounded-md">
                          {item.category || 'Menu'}
                        </span>
                      </div>
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
                          min="0"
                          placeholder="0"
                          value={item.targetOfflinePrice === 0 ? '' : item.targetOfflinePrice}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                            e.target.value = stringValue;
                            onUpdateItem(item.id, { targetOfflinePrice: numericValue });
                          }}
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
                          min="0"
                          placeholder="0"
                          value={item.displayPrice === 0 ? '' : item.displayPrice}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                            e.target.value = stringValue;
                            onUpdateItem(item.id, { displayPrice: numericValue });
                          }}
                          className="w-24 font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      {calc && calc.discountAmount > 0 && (
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5 tabular-nums">
                          Bayar: <strong className="text-slate-700">{formatRupiah(calc.subtotalAfterDiscount)}</strong>
                        </span>
                      )}
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
              <th scope="col" className="pl-4 pr-2 py-3.5 border-b border-slate-200/80 w-9 text-center">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleSelectPage}
                  disabled={paginatedItems.length === 0}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                  title="Pilih semua menu di halaman ini"
                  aria-label="Pilih semua menu di halaman ini"
                />
              </th>
              <th scope="col" className="px-3 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-left min-w-50">
                <button
                  type="button"
                  onClick={() => handleSortColumn('NAME')}
                  className="group inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Menu & Kategori</span>
                  {renderSortIcon('NAME')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-32.5">
                <button
                  type="button"
                  onClick={() => handleSortColumn('TARGET_PRICE')}
                  className="group inline-flex items-center justify-end gap-1.5 hover:text-slate-900 cursor-pointer ml-auto"
                >
                  <span>Target Offline</span>
                  {renderSortIcon('TARGET_PRICE')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-right min-w-35">
                <button
                  type="button"
                  onClick={() => handleSortColumn('DISPLAY_PRICE')}
                  className="group inline-flex items-center justify-end gap-1.5 hover:text-slate-900 cursor-pointer ml-auto"
                >
                  <span>Harga Jual App</span>
                  {renderSortIcon('DISPLAY_PRICE')}
                </button>
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
                <button
                  type="button"
                  onClick={() => handleSortColumn('NET_PAYOUT')}
                  className="group inline-flex items-center justify-end gap-1.5 hover:text-slate-900 cursor-pointer ml-auto"
                >
                  <span>Net Payout</span>
                  {renderSortIcon('NET_PAYOUT')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200/80 text-center min-w-35">
                <button
                  type="button"
                  onClick={() => handleSortColumn('VARIANCE')}
                  className="group inline-flex items-center justify-center gap-1.5 hover:text-slate-900 cursor-pointer mx-auto"
                  title="Klik untuk urutkan dari Paling Boncos"
                >
                  <span>Status / Selisih</span>
                  {renderSortIcon('VARIANCE')}
                </button>
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
            {isLoading ? (
              [1, 2, 3, 4].map((idx) => (
                <tr key={`row-skeleton-${idx}`} className="animate-pulse bg-slate-50/40">
                  <td className="pl-4 pr-2 py-3.5 text-center">
                    <div className="h-3.5 w-3.5 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="h-4 w-40 bg-slate-200 rounded mb-1.5" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-4 w-18 bg-slate-100 rounded ml-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-4 w-18 bg-slate-100 rounded ml-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-4 w-16 bg-slate-100 rounded ml-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-5 w-20 bg-slate-100 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-4 w-18 bg-slate-100 rounded ml-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-5 w-20 bg-slate-200 rounded ml-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-6 w-24 bg-slate-100 rounded-lg mx-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-4 w-24 bg-slate-100 rounded ml-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-6 w-24 bg-slate-100 rounded-lg mx-auto" />
                  </td>
                </tr>
              ))
            ) : sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-12 text-center text-slate-400 font-medium"
                >
                  Tidak ada menu yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const calc = calculations.get(item.id);
                const isBoncos = calc ? calc.variance < 0 : false;
                const isHighlighted = item.id === highlightedItemId;
                const isSelected = activeSelectedSet.has(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-200 ${
                      isHighlighted
                        ? 'bg-emerald-50/80 ring-2 ring-emerald-400/80 ring-inset'
                        : isSelected
                        ? 'bg-slate-100/80'
                        : isBoncos
                        ? 'bg-rose-50/20 hover:bg-rose-50/40'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* 0. Selection Checkbox */}
                    <td className="pl-4 pr-2 py-3.5 whitespace-nowrap border-b border-slate-100 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(item.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        aria-label={`Pilih ${item.name}`}
                      />
                    </td>

                    {/* 1. Menu Name & Category */}
                    <td className="px-3 py-3.5 whitespace-nowrap border-b border-slate-100 text-left">
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
                          min="0"
                          placeholder="0"
                          value={item.targetOfflinePrice === 0 ? '' : item.targetOfflinePrice}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                            e.target.value = stringValue;
                            onUpdateItem(item.id, { targetOfflinePrice: numericValue });
                          }}
                          className="w-20 text-right font-bold text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 tabular-nums focus:outline-none transition-colors"
                        />
                      </div>
                    </td>

                    {/* 3. Display Price (Editable Inline + Psychological Price Preview) */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="number"
                          step="500"
                          min="0"
                          placeholder="0"
                          value={item.displayPrice === 0 ? '' : item.displayPrice}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                            e.target.value = stringValue;
                            onUpdateItem(item.id, { displayPrice: numericValue });
                          }}
                          className={`w-20 text-right font-bold bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 tabular-nums focus:outline-none transition-colors ${
                            isBoncos ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        />
                      </div>
                      {calc && calc.discountAmount > 0 && (
                        <div
                          className="text-[10px] text-slate-500 font-medium mt-0.5 tabular-nums"
                          title="Harga yang dibayar konsumen setelah diskon"
                        >
                          Bayar: <span className="font-bold text-slate-700">{formatRupiah(calc.subtotalAfterDiscount)}</span>
                        </div>
                      )}
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
                          max={item.merchantDiscountType === 'PERCENT' ? 100 : undefined}
                          placeholder="0"
                          value={item.merchantDiscountValue === 0 ? '' : item.merchantDiscountValue}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, {
                              min: 0,
                              max: item.merchantDiscountType === 'PERCENT' ? 100 : undefined,
                            });
                            e.target.value = stringValue;
                            onUpdateItem(item.id, { merchantDiscountValue: numericValue });
                          }}
                          className="w-16 text-right font-semibold text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded-lg px-1.5 py-1 tabular-nums focus:outline-none transition-colors"
                        />
                      </div>
                      {calc && (
                        isGrab ? (
                          <div className="text-[11px] text-rose-500 font-mono mt-0.5 tabular-nums">
                            -{formatRupiah(calc.discountAmount)}
                          </div>
                        ) : (
                          <div
                            className="text-[10px] text-rose-600 font-mono mt-0.5 tabular-nums"
                            title={`Total diskon konsumen: ${formatRupiah(calc.discountAmount)} • Disubsidi Gojek: ${formatRupiah(calc.gojekPromoShare ?? 0)} • Beban Mitra: ${formatRupiah(calc.mitraPromoShare ?? 0)}`}
                          >
                            Mitra: -{formatRupiah(calc.mitraPromoShare ?? calc.discountAmount)}
                          </div>
                        )
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
                          <span>
                            {(item.gojekSubsidyPct ?? 25) > 0
                              ? `Disubsidi ${item.gojekSubsidyPct ?? 25}%`
                              : 'Mandiri (0%)'}
                          </span>
                        </button>
                      </td>
                    )}

                    {/* 6. Total Platform Deduction */}
                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-100 text-right">
                      <div
                        className="font-semibold text-slate-800 tabular-nums"
                        title={
                          !isGrab && calc
                            ? `Biaya Layanan GoFood: ${formatRupiah(calc.platformFee)} + Promo Mitra: ${formatRupiah(calc.mitraPromoShare ?? 0)}`
                            : undefined
                        }
                      >
                        {calc ? formatRupiah(calc.totalPlatformDeduction) : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {calc
                          ? isGrab
                            ? `${calc.effectiveCommissionRatePct}% cut`
                            : `Layanan ${formatRupiah(calc.platformFee)}`
                          : ''}
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

      {/* Table Footer & Pagination Bar */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col lg:flex-row items-center justify-between gap-3.5">
        {/* Left: Item Range Info & Page Size Selector */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full lg:w-auto">
          <div className="text-slate-600 tabular-nums">
            {filteredItems.length === 0 ? (
              <span>Menampilkan 0 dari {items.length} menu</span>
            ) : (
              <span>
                Menampilkan{' '}
                <span className="font-bold text-slate-900">
                  {startIndex + 1}–{endIndex}
                </span>{' '}
                dari{' '}
                <span className="font-bold text-slate-900">
                  {filteredItems.length}
                </span>{' '}
                menu
                {filteredItems.length !== items.length && (
                  <span className="text-slate-400">
                    {' '}
                    (difilter dari {items.length} total menu)
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="h-3.5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <label htmlFor="page-size-select" className="text-slate-500 font-medium">
              Baris per halaman:
            </label>
            <select
              id="page-size-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold bg-white border border-slate-200/90 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} menu
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Pagination Controls */}
        {filteredItems.length > 0 && (
          <div className="flex items-center gap-1 self-center lg:self-auto">
            {/* First Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Halaman Pertama"
              aria-label="Halaman Pertama"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 px-1">
              {pageNumbers.map((page, idx) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 text-slate-400 font-bold select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold tabular-nums transition-all cursor-pointer ${
                      safeCurrentPage === page
                        ? isGrab
                          ? 'bg-[#00B14F] text-white shadow-xs shadow-emerald-500/20'
                          : 'bg-[#EE2737] text-white shadow-xs shadow-red-500/20'
                        : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, Math.min(prev, totalPages) + 1))
              }
              disabled={safeCurrentPage === totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Halaman Berikutnya"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Halaman Terakhir"
              aria-label="Halaman Terakhir"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
