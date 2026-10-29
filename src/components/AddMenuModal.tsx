'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  DiscountType,
  GlobalPresets,
  MenuItem,
  WorkspaceChannel,
} from '@/types/pricing';
import {
  calculateForward,
  calculateRecommendedPrice,
  formatRupiah,
} from '@/lib/pricing-engine';
import {
  FoodSuggestion,
  getFoodSuggestions,
  inferCategoryFromMenuName,
} from '@/lib/food-catalog';
import {
  sanitizeNumericInput,
  handleNumberInputFocus,
} from '@/lib/input-utils';
import { X, Plus, Sparkles, FolderPlus, Utensils, Check } from 'lucide-react';

interface AddMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: WorkspaceChannel;
  presets: GlobalPresets;
  categories?: string[];
  existingItems?: MenuItem[];
  onAddMenuItem: (newItem: MenuItem) => void;
  onAddNewCategory?: (newCategory: string) => void;
}

export function AddMenuModal({
  isOpen,
  onClose,
  channel,
  presets,
  categories = ['Makanan Utama', 'Paket Nasi', 'Menu Spesial', 'Minuman', 'Camilan / Snack'],
  existingItems = [],
  onAddMenuItem,
  onAddNewCategory,
}: AddMenuModalProps) {
  const isGrab = channel === 'GRABFOOD';

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Makanan Utama');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [targetOfflinePrice, setTargetOfflinePrice] = useState<number>(30000);
  const [displayPrice, setDisplayPrice] = useState<number>(60000);
  const [discountType, setDiscountType] = useState<DiscountType>(presets.merchantDiscountType);
  const [discountValue, setDiscountValue] = useState<number>(presets.merchantDiscountValue);
  const [isBoosterActive, setIsBoosterActive] = useState<boolean>(
    isGrab ? presets.isBoosterActiveDefault : false
  );
  const [gojekSubsidyPct, setGojekSubsidyPct] = useState<number>(
    presets.gojekSubsidyPct ?? 25
  );
  const [notes, setNotes] = useState('');

  // Auto-fill & auto-suggest states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [inferredBadge, setInferredBadge] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Real-time suggestions based on current typed name
  const suggestions = getFoodSuggestions(name, existingItems, categories, 6);

  const forwardCalc = calculateForward(
    displayPrice,
    targetOfflinePrice,
    discountType,
    discountValue,
    presets.platformCommissionPct,
    presets.marketingBoosterPct,
    isBoosterActive,
    channel,
    gojekSubsidyPct,
    presets.isCoFundedPromo ?? true
  );

  const recommendation = calculateRecommendedPrice(
    targetOfflinePrice,
    discountType,
    discountValue,
    presets.platformCommissionPct,
    presets.marketingBoosterPct,
    isBoosterActive,
    presets.roundingRule,
    channel,
    gojekSubsidyPct,
    presets.isCoFundedPromo ?? true
  );

  const handleApplyRecommended = () => {
    setDisplayPrice(recommendation.roundedRecommendedPrice);
  };

  // Handle typing in Menu Name with real-time category linking
  const handleNameChange = (val: string) => {
    setName(val);
    setShowSuggestions(true);
    setSelectedIndex(-1);

    // Auto-infer category from name
    const detected = inferCategoryFromMenuName(val, categories);
    if (detected) {
      setInferredBadge(detected);
      if (!isAddingNewCat) {
        setCategory(detected);
      }
    } else {
      setInferredBadge(null);
    }
  };

  // Select a suggestion from the autofill list
  const handleSelectSuggestion = (sug: FoodSuggestion) => {
    setName(sug.name);
    setCategory(sug.category);
    setInferredBadge(sug.category);
    setShowSuggestions(false);

    // Update targetOfflinePrice if still at default or user wants benchmark
    if (targetOfflinePrice === 30000 || targetOfflinePrice === 0) {
      setTargetOfflinePrice(sug.suggestedOfflinePrice);
      const rec = calculateRecommendedPrice(
        sug.suggestedOfflinePrice,
        discountType,
        discountValue,
        presets.platformCommissionPct,
        presets.marketingBoosterPct,
        isBoosterActive,
        presets.roundingRule,
        channel,
        gojekSubsidyPct,
        presets.isCoFundedPromo ?? true
      );
      setDisplayPrice(rec.roundedRecommendedPrice);
    }
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalCat = category;
    if (isAddingNewCat && newCatInput.trim()) {
      finalCat = newCatInput.trim();
      if (onAddNewCategory) {
        onAddNewCategory(finalCat);
      }
    }

    const newItem: MenuItem = {
      id: `${channel.toLowerCase()}-${Date.now()}`,
      name: name.trim(),
      category: finalCat.trim() || 'Makanan Utama',
      channel,
      targetOfflinePrice: Math.round(targetOfflinePrice),
      displayPrice: Math.round(displayPrice),
      merchantDiscountType: discountType,
      merchantDiscountValue: Number(discountValue),
      platformCommissionPct: presets.platformCommissionPct,
      marketingBoosterPct: isGrab ? presets.marketingBoosterPct : 0,
      isBoosterActive: isGrab ? isBoosterActive : false,
      gojekSubsidyPct: !isGrab ? gojekSubsidyPct : undefined,
      isCoFundedPromo: !isGrab,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddMenuItem(newItem);
    onClose();
    setName('');
    setNotes('');
    setIsAddingNewCat(false);
    setNewCatInput('');
    setShowSuggestions(false);
    setInferredBadge(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Tambah Menu ({isGrab ? 'GrabFood' : 'GoFood'})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-normal">
              Dilengkapi autofill cerdas yang otomatis terhubung ke kategori menu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Menu Name with Smart Autofill & Category Link */}
            <div className="sm:col-span-2 relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Menu Makanan / Minuman <span className="text-rose-500">*</span>
                </label>
                {inferredBadge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 animate-in fade-in">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Kategori terhubung: <strong>{inferredBadge}</strong></span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ketik nama menu, misal: Nasi Rames, Ayam Geprek, Es Teh..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/50 focus:bg-white"
                />
                {name && (
                  <button
                    type="button"
                    onClick={() => {
                      setName('');
                      setInferredBadge(null);
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Floating Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Rekomendasi Menu & Kategori</span>
                    <span className="text-[10px] text-slate-400">Pilih untuk auto-fill</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={`${sug.name}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 hover:bg-emerald-50/70 transition-colors cursor-pointer ${
                          selectedIndex === idx ? 'bg-emerald-50 ring-1 ring-emerald-400 ring-inset' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Utensils className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {sug.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Estimasi modal: {formatRupiah(sug.suggestedOfflinePrice)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            {sug.category}
                          </span>
                          {sug.source === 'existing' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700">
                              Toko Anda
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kategori Menu
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>{isAddingNewCat ? 'Pilih Kategori' : '+ Baru'}</span>
                </button>
              </div>

              {isAddingNewCat ? (
                <input
                  type="text"
                  placeholder="Ketik kategori baru..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  autoFocus
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-emerald-500 rounded-xl focus:outline-none bg-white text-slate-900"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setInferredBadge(e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {!categories.includes(category) && category && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              )}
            </div>

            {/* Target Offline Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Payout Bersih (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-medium text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  placeholder="0"
                  value={targetOfflinePrice === 0 ? '' : targetOfflinePrice}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => {
                    const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                    e.target.value = stringValue;
                    setTargetOfflinePrice(numericValue);
                  }}
                  className="w-full text-xs font-bold pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 tabular-nums bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Display Price with Recommend Action */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Harga Jual di Aplikasi ({isGrab ? 'GrabFood' : 'GoFood'})
                </label>
                <button
                  type="button"
                  onClick={handleApplyRecommended}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>
                    Pakai Rekomendasi ({formatRupiah(recommendation.roundedRecommendedPrice)})
                  </span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-medium text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  placeholder="0"
                  value={displayPrice === 0 ? '' : displayPrice}
                  onFocus={handleNumberInputFocus}
                  onChange={(e) => {
                    const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                    e.target.value = stringValue;
                    setDisplayPrice(numericValue);
                  }}
                  className="w-full text-sm font-bold pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 tabular-nums bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Discount Settings */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipe Diskon Merchant
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
              >
                <option value="PERCENT">Persentase (%)</option>
                <option value="NOMINAL">Nominal (Rp)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nilai Diskon ({discountType === 'PERCENT' ? '%' : 'Rp'})
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'PERCENT' ? 100 : undefined}
                step={discountType === 'PERCENT' ? 1 : 500}
                placeholder="0"
                value={discountValue === 0 ? '' : discountValue}
                onFocus={handleNumberInputFocus}
                onChange={(e) => {
                  const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, {
                    min: 0,
                    max: discountType === 'PERCENT' ? 100 : undefined,
                  });
                  e.target.value = stringValue;
                  setDiscountValue(numericValue);
                }}
                className="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 tabular-nums bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Platform Booster (GrabFood) or Subsidi Gojek (GoFood) */}
            {isGrab ? (
              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Ikut Promo PUAS (Grab Booster 14%)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Menambah biaya pemasaran platform sebesar +14%
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isBoosterActive}
                  onChange={(e) => setIsBoosterActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Skema Program Maksimal PRO (GoFood)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Gojek mensubsidi {gojekSubsidyPct}%, resto menanggung {100 - gojekSubsidyPct}% diskon
                  </span>
                </div>
                <select
                  value={gojekSubsidyPct}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setGojekSubsidyPct(Number.isNaN(parsed) ? 25 : parsed);
                  }}
                  className="font-bold text-rose-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={25}>Disubsidi 25% (Mitra 75%)</option>
                  <option value={30}>Disubsidi 30% (Mitra 70%)</option>
                  <option value={0}>0% (Mitra 100%)</option>
                  <option value={50}>50% (50/50)</option>
                </select>
              </div>
            )}

            {/* Live Calculation Margin Preview */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
              {!isGrab && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-200/70">
                  <span>
                    Rincian Potongan GoFood (Layanan {formatRupiah(forwardCalc.platformFee)} + Promo Mitra {formatRupiah(forwardCalc.mitraPromoShare ?? 0)}):
                  </span>
                  <span className="font-semibold text-rose-600 tabular-nums">
                    -{formatRupiah(forwardCalc.totalPlatformDeduction)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Hasil Net Payout:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(forwardCalc.netPayout)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Selisih vs Target:</span>
                <span
                  className={`font-bold tabular-nums ${
                    forwardCalc.variance < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatRupiah(forwardCalc.variance, true)}{' '}
                  {forwardCalc.variance < 0 ? '(Boncos)' : '(Aman)'}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan Menu (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Paket hemat makan siang, Porsi jumbo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Simpan Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
