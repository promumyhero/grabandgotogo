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
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FolderPlus,
  ShieldCheck,
  Check,
  Pencil,
  Utensils,
} from 'lucide-react';

interface EditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  channel: WorkspaceChannel;
  presets: GlobalPresets;
  categories: string[];
  existingItems?: MenuItem[];
  onSaveItem: (updatedItem: MenuItem) => void;
  onAddNewCategory?: (newCategory: string) => void;
}

export function EditMenuModal({
  isOpen,
  onClose,
  item,
  channel,
  presets,
  categories,
  existingItems = [],
  onSaveItem,
  onAddNewCategory,
}: EditMenuModalProps) {
  const isGrab = channel === 'GRABFOOD';

  // Form State initialized directly from item
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState(item?.category || (categories[0] ?? 'Makanan'));
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const [targetOfflinePrice, setTargetOfflinePrice] = useState<number>(item?.targetOfflinePrice ?? 0);
  const [displayPrice, setDisplayPrice] = useState<number>(item?.displayPrice ?? 0);
  const [discountType, setDiscountType] = useState<DiscountType>(item?.merchantDiscountType ?? 'PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(item?.merchantDiscountValue ?? 0);

  // Platform specific states
  const [isBoosterActive, setIsBoosterActive] = useState<boolean>(item?.isBoosterActive ?? false);
  const [gojekSubsidyPct, setGojekSubsidyPct] = useState<number>(item?.gojekSubsidyPct ?? presets.gojekSubsidyPct ?? 25);
  const isCoFundedPromo = item?.isCoFundedPromo ?? presets.isCoFundedPromo ?? true;
  const [notes, setNotes] = useState(item?.notes || '');

  // Confirmation Pop-up state ("Apakah pengeditan sudah final / fix?")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  if (!isOpen || !item) return null;

  // Real-time suggestions based on current typed name
  const suggestions = getFoodSuggestions(name, existingItems, categories, 6);

  // Real-time calculation preview
  const forwardCalc = calculateForward(
    displayPrice,
    targetOfflinePrice,
    discountType,
    discountValue,
    item.platformCommissionPct || presets.platformCommissionPct,
    item.marketingBoosterPct || presets.marketingBoosterPct,
    isBoosterActive,
    channel,
    gojekSubsidyPct,
    isCoFundedPromo
  );

  const recommendation = calculateRecommendedPrice(
    targetOfflinePrice,
    discountType,
    discountValue,
    item.platformCommissionPct || presets.platformCommissionPct,
    item.marketingBoosterPct || presets.marketingBoosterPct,
    isBoosterActive,
    presets.roundingRule,
    channel,
    gojekSubsidyPct,
    isCoFundedPromo
  );

  const handleApplyRecommended = () => {
    setDisplayPrice(recommendation.roundedRecommendedPrice);
  };

  // Handle typing in Menu Name with real-time category linking
  const handleNameChange = (val: string) => {
    setName(val);
    setShowSuggestions(true);
    setSelectedIndex(-1);

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

    if (targetOfflinePrice === 0) {
      setTargetOfflinePrice(sug.suggestedOfflinePrice);
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

  // Pre-submit validation -> Open confirmation prompt
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsConfirmOpen(true);
  };

  // Final confirmation approved
  const handleFinalConfirmSave = () => {
    let finalCategory = category;
    if (isAddingNewCat && newCatInput.trim()) {
      finalCategory = newCatInput.trim();
      if (onAddNewCategory) {
        onAddNewCategory(finalCategory);
      }
    }

    const updatedItem: MenuItem = {
      ...item,
      name: name.trim(),
      category: finalCategory.trim() || 'Menu',
      targetOfflinePrice: Math.round(targetOfflinePrice),
      displayPrice: Math.round(displayPrice),
      merchantDiscountType: discountType,
      merchantDiscountValue: Number(discountValue),
      isBoosterActive,
      gojekSubsidyPct: !isGrab ? gojekSubsidyPct : undefined,
      isCoFundedPromo: !isGrab ? isCoFundedPromo : undefined,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveItem(updatedItem);
    setIsConfirmOpen(false);
    onClose();
  };

  const isBoncos = forwardCalc.variance < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isGrab ? 'bg-[#00B14F]' : 'bg-[#EE2737]'
              }`}
            >
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Edit Menu & Kalkulasi
              </h3>
              <p className="text-xs text-slate-500">
                Workspace {isGrab ? 'GrabFood' : 'GoFood'} • Sesuaikan harga & formula
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handlePreSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Nama Menu & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 block">
                  Nama Menu <span className="text-rose-500">*</span>
                </label>
                {inferredBadge && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Terhubung: <strong>{inferredBadge}</strong></span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Contoh: Nasi Rames, Ayam Geprek, Es Teh..."
                  className="w-full font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
                />
                {name && (
                  <button
                    type="button"
                    onClick={() => {
                      setName('');
                      setInferredBadge(null);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Floating Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Rekomendasi Menu & Kategori</span>
                    <span className="text-[10px] text-slate-400">Pilih untuk auto-fill</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={`${sug.name}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-emerald-50/70 transition-colors cursor-pointer ${
                          selectedIndex === idx ? 'bg-emerald-50 ring-1 ring-emerald-400 ring-inset' : ''
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
                              Toko
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Kategori</label>
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
                  className="w-full font-medium px-3 py-2 bg-white border border-emerald-500 rounded-xl focus:outline-none text-slate-900"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
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
          </div>

          {/* 2. Target Offline vs Display Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90">
              <label className="font-bold text-slate-700 block mb-1">
                Target Uang Masuk (Offline)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">Rp</span>
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
                  className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Nilai bersih yang wajib Anda terima di rekening resto
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Harga Jual di Aplikasi</label>
                <button
                  type="button"
                  onClick={handleApplyRecommended}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200/80 transition-colors"
                  title="Gunakan harga ideal rekomendasi mesin agar bebas boncos"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Saran Bebas Boncos</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">Rp</span>
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
                  className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Saran minimum: {formatRupiah(recommendation.roundedRecommendedPrice)}
              </span>
            </div>
          </div>

          {/* 3. Diskon & Platform Specific Campaign Settings */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-700 flex items-center gap-1">
              <span>Pengaturan Promo & Pemotongan</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 font-medium block mb-1">
                  {isGrab ? 'Tipe Diskon Mitra' : 'Tipe Promo Konsumen'}
                </span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="w-full font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="PERCENT">Persentase (%)</option>
                  <option value="NOMINAL">Nominal (Rp)</option>
                </select>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-1">
                  {discountType === 'PERCENT' ? 'Besar Diskon (%)' : 'Besar Diskon (Rp)'}
                </span>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'PERCENT' ? 100 : undefined}
                  step={discountType === 'PERCENT' ? '1' : '500'}
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
                  className="w-full font-bold text-slate-900 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Grab Booster Toggle */}
            {isGrab && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <div>
                  <span className="font-bold text-slate-700 block">
                    PUAS Marketing Booster (+14%)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Aktifkan jika resto bergabung dalam kampanye promosi PUAS Grab
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBoosterActive(!isBoosterActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isBoosterActive ? 'bg-[#00B14F]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      isBoosterActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* GoFood Specific: Subsidi Gojek Selector */}
            {!isGrab && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">
                    Skema Program Maksimal PRO
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Gojek mendanai {gojekSubsidyPct}%, resto mendanai {100 - gojekSubsidyPct}%
                  </span>
                </div>
                <select
                  value={gojekSubsidyPct}
                  onChange={(e) => setGojekSubsidyPct(parseInt(e.target.value) || 25)}
                  className="font-bold text-rose-700 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={25}>Disubsidi 25% (Mitra 75%)</option>
                  <option value={30}>Disubsidi 30% (Mitra 70%)</option>
                  <option value={0}>0% (Mitra 100%)</option>
                  <option value={50}>50% (50/50)</option>
                </select>
              </div>
            )}
          </div>

          {/* 4. Live Calculation Preview Card */}
          <div
            className={`p-3.5 rounded-xl border space-y-2 transition-colors ${
              isBoncos
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                {isBoncos ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>Hasil Perhitungan Bersih</span>
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  isBoncos
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isBoncos ? 'Defisit / Boncos' : 'Margin Aman / Untung'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Potongan</span>
                <span className="font-bold text-slate-800 tabular-nums">
                  -{formatRupiah(forwardCalc.totalPlatformDeduction)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Net Payout Bersih</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(forwardCalc.netPayout)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Selisih vs Target</span>
                <span
                  className={`font-extrabold tabular-nums ${
                    isBoncos ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {formatRupiah(forwardCalc.variance, true)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Catatan / Notes */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1">
              Catatan Menu (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Menu promo weekend, best seller, dll..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
            />
          </div>

          {/* Bottom Actions inside Form */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                isGrab
                  ? 'bg-[#00B14F] hover:bg-emerald-600'
                  : 'bg-[#EE2737] hover:bg-rose-700'
              }`}
            >
              Simpan Perubahan
            </button>
          </div>
        </form>

        {/* POP-UP CONFIRMATION MODAL ("Apakah pengeditan sudah final atau fix?") */}
        {isConfirmOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full space-y-4 text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Konfirmasi Pengeditan Menu
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Apakah pengeditan menu ini sudah final dan fix?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Menu:</span>
                  <span className="font-bold text-slate-900 truncate max-w-45">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Jual Baru:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatRupiah(displayPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Payout Bersih:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatRupiah(forwardCalc.netPayout)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Status Margin:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      isBoncos ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isBoncos ? 'Defisit ' : 'Surplus '}
                    {formatRupiah(forwardCalc.variance, true)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cek Lagi
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirmSave}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                    isGrab
                      ? 'bg-[#00B14F] hover:bg-emerald-600'
                      : 'bg-[#EE2737] hover:bg-rose-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ya, Simpan (Final)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
