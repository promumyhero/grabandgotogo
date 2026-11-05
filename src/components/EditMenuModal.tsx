'use client';

import React, { useState, useEffect } from 'react';
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
  FolderPlus,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { MenuNameAutocomplete } from '@/components/MenuNameAutocomplete';

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

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState(item?.category || (categories[0] ?? 'Makanan'));
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const [targetOfflinePrice, setTargetOfflinePrice] = useState<number>(item?.targetOfflinePrice ?? 0);
  const [displayPrice, setDisplayPrice] = useState<number>(item?.displayPrice ?? 0);
  const [discountType, setDiscountType] = useState<DiscountType>(item?.merchantDiscountType ?? 'PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(item?.merchantDiscountValue ?? 0);

  const [isBoosterActive, setIsBoosterActive] = useState<boolean>(item?.isBoosterActive ?? false);
  const [gojekSubsidyPct, setGojekSubsidyPct] = useState<number>(item?.gojekSubsidyPct ?? presets.gojekSubsidyPct ?? 25);
  const isCoFundedPromo = item?.isCoFundedPromo ?? presets.isCoFundedPromo ?? true;
  const [notes, setNotes] = useState(item?.notes || '');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [inferredBadge, setInferredBadge] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isConfirmOpen) {
          setIsConfirmOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirmOpen, onClose]);

  if (!isOpen || !item) return null;

  const suggestions = getFoodSuggestions(name, existingItems, categories, 6);

  const forwardCalc = calculateForward(
    displayPrice,
    targetOfflinePrice,
    discountType,
    discountValue,
    item.platformCommissionPct ?? presets.platformCommissionPct,
    item.marketingBoosterPct ?? presets.marketingBoosterPct,
    isBoosterActive,
    channel,
    gojekSubsidyPct,
    isCoFundedPromo
  );

  const recommendation = calculateRecommendedPrice(
    targetOfflinePrice,
    discountType,
    discountValue,
    item.platformCommissionPct ?? presets.platformCommissionPct,
    item.marketingBoosterPct ?? presets.marketingBoosterPct,
    isBoosterActive,
    presets.roundingRule,
    channel,
    gojekSubsidyPct,
    isCoFundedPromo
  );

  const handleApplyRecommended = () => {
    setDisplayPrice(recommendation.roundedRecommendedPrice);
  };

  const handleNameChange = (val: string) => {
    setName(val);
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

  const handleSelectSuggestion = (sug: FoodSuggestion) => {
    setName(sug.name);
    setCategory(sug.category);
    setInferredBadge(sug.category);

    if (targetOfflinePrice === 0) {
      setTargetOfflinePrice(sug.suggestedOfflinePrice);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsConfirmOpen(true);
  };

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-menu-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Minimalist Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 id="edit-menu-modal-title" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Edit Menu & Kalkulasi ({isGrab ? 'GrabFood' : 'GoFood'})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan parameter harga, diskon, dan kampanye promosi menu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handlePreSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Nama Menu & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <MenuNameAutocomplete
                id="edit-menu-name"
                value={name}
                inferredBadge={inferredBadge}
                suggestions={suggestions}
                onChange={handleNameChange}
                onClear={() => {
                  setName('');
                  setInferredBadge(null);
                }}
                onSelectSuggestion={handleSelectSuggestion}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="edit-menu-category" className="font-semibold text-slate-700">
                  Kategori
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>{isAddingNewCat ? 'Pilih Kategori' : '+ Kategori Baru'}</span>
                </button>
              </div>

              {isAddingNewCat ? (
                <input
                  id="edit-menu-category"
                  type="text"
                  placeholder="Ketik kategori baru..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  autoFocus
                  className="w-full font-medium px-3 py-2 bg-white border border-slate-400 rounded-lg focus:outline-none text-slate-900"
                />
              ) : (
                <select
                  id="edit-menu-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setInferredBadge(e.target.value);
                  }}
                  className="w-full font-medium px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="edit-target-price" className="font-semibold text-slate-700 block mb-1.5">
                Target Payout Offline (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 select-none">Rp</span>
                <input
                  id="edit-target-price"
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
                  className="w-full font-semibold text-slate-900 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 tabular-nums focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="edit-display-price" className="font-semibold text-slate-700">
                  Harga Jual App
                </label>
                <button
                  type="button"
                  onClick={handleApplyRecommended}
                  className="text-[11px] font-semibold text-slate-900 hover:text-slate-600 flex items-center gap-0.5 cursor-pointer underline underline-offset-2 tabular-nums"
                  title="Terapkan harga ideal rekomendasi"
                >
                  <span>Pakai {formatRupiah(recommendation.roundedRecommendedPrice)}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 select-none">Rp</span>
                <input
                  id="edit-display-price"
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
                  className="w-full font-semibold text-slate-900 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 tabular-nums focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Diskon & Platform Specific Campaign Settings */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
            <div className="font-semibold text-slate-800">
              Pengaturan Promo & Pemotongan Platform
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-disc-type" className="text-slate-500 block mb-1">
                  {isGrab ? 'Tipe Diskon Mitra' : 'Tipe Promo Konsumen'}
                </label>
                <select
                  id="edit-disc-type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="w-full font-medium px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                >
                  <option value="PERCENT">Persentase (%)</option>
                  <option value="NOMINAL">Nominal (Rp)</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-disc-val" className="text-slate-500 block mb-1">
                  {discountType === 'PERCENT' ? 'Besar Diskon (%)' : 'Besar Diskon (Rp)'}
                </label>
                <input
                  id="edit-disc-val"
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
                  className="w-full font-semibold text-slate-900 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 tabular-nums"
                />
              </div>
            </div>

            {isGrab ? (
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    PUAS Marketing Booster (+{item.marketingBoosterPct ?? presets.marketingBoosterPct}%)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aktifkan bila menu diikutsertakan dalam kampanye promosi Grab
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isBoosterActive}
                  onClick={() => setIsBoosterActive(!isBoosterActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isBoosterActive ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      isBoosterActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ) : (
              <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Skema Program Maksimal PRO
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Gojek mensubsidi {gojekSubsidyPct}%, resto menanggung {100 - gojekSubsidyPct}%
                  </span>
                </div>
                <select
                  aria-label="Skema subsidi Gojek"
                  value={gojekSubsidyPct}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setGojekSubsidyPct(Number.isNaN(parsed) ? 25 : parsed);
                  }}
                  className="font-semibold text-slate-900 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={25}>Subsidi 25% (Mitra 75%)</option>
                  <option value={30}>Subsidi 30% (Mitra 70%)</option>
                  <option value={0}>0% (Mandiri 100%)</option>
                  <option value={50}>50% (50/50)</option>
                </select>
              </div>
            )}
          </div>

          {/* 4. Live Calculation Preview Card */}
          <div className="p-3.5 rounded-lg border border-slate-200/90 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Ringkasan Margin Bersih
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                  isBoncos
                    ? 'bg-rose-50/70 text-rose-700 border-rose-200/80'
                    : 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBoncos ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
                <span>{isBoncos ? 'Defisit' : 'Margin Aman'}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Potongan</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  -{formatRupiah(forwardCalc.totalPlatformDeduction)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Net Payout</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(forwardCalc.netPayout)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Selisih vs Target</span>
                <span
                  className={`font-bold tabular-nums ${
                    isBoncos ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatRupiah(forwardCalc.variance, true)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Catatan / Notes */}
          <div>
            <label htmlFor="edit-menu-notes" className="font-semibold text-slate-700 block mb-1.5">
              Catatan Menu (Opsional)
            </label>
            <input
              id="edit-menu-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Menu promo akhir pekan, best seller..."
              className="w-full px-3 py-2 bg-slate-50/50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-800"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        {isConfirmOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 max-w-sm w-full space-y-4 text-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Konfirmasi Perubahan Menu
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pastikan rincian harga dan margin berikut sudah sesuai sebelum disimpan.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Menu</span>
                  <span className="font-semibold text-slate-900 truncate max-w-44">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Aplikasi</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(displayPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Payout</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(forwardCalc.netPayout)}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500">Selisih Target</span>
                  <span
                    className={`font-bold tabular-nums ${
                      isBoncos ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatRupiah(forwardCalc.variance, true)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirmSave}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Konfirmasi Simpan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
