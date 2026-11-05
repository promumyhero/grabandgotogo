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
import { X, FolderPlus, ArrowUpRight } from 'lucide-react';
import { MenuNameAutocomplete } from '@/components/MenuNameAutocomplete';

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
  const [inferredBadge, setInferredBadge] = useState<string | null>(null);
  const [showHppHelper, setShowHppHelper] = useState(false);
  const [hppCost, setHppCost] = useState<number>(15000);
  const [packagingCost, setPackagingCost] = useState<number>(2000);
  const [targetProfitPct, setTargetProfitPct] = useState<number>(40);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const newItem: MenuItem = {
      id: `${channel.toLowerCase()}-${Date.now()}-${randomSuffix}`,
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
      isCoFundedPromo: !isGrab ? (presets.isCoFundedPromo ?? true) : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddMenuItem(newItem);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-menu-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Minimalist Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 id="add-menu-modal-title" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Tambah Menu ({isGrab ? 'GrabFood' : 'GoFood'})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan harga offline target untuk mendapatkan rekomendasi harga aplikasi
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <MenuNameAutocomplete
                id="add-menu-name"
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

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="add-menu-category" className="block font-semibold text-slate-700">
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
                  id="add-menu-category"
                  type="text"
                  placeholder="Ketik kategori baru..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  autoFocus
                  className="w-full font-medium px-3 py-2 border border-slate-400 rounded-lg focus:outline-none bg-white text-slate-900"
                />
              ) : (
                <select
                  id="add-menu-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setInferredBadge(e.target.value);
                  }}
                  className="w-full font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 cursor-pointer"
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

            {/* Target Offline Price + Optional HPP Helper */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="add-target-price" className="block font-semibold text-slate-700">
                  Target Payout Bersih (Rp)
                </label>
                <button
                  type="button"
                  onClick={() => setShowHppHelper((prev) => !prev)}
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  {showHppHelper ? 'Tutup Bantu HPP' : 'Hitung dari HPP'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 select-none">
                  Rp
                </span>
                <input
                  id="add-target-price"
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
                  className="w-full font-semibold pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 tabular-nums bg-slate-50/50 focus:bg-white"
                />
              </div>

              {showHppHelper && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                        Bahan (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={hppCost}
                        onFocus={handleNumberInputFocus}
                        onChange={(e) => {
                          const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                          e.target.value = stringValue;
                          setHppCost(numericValue);
                        }}
                        className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                        Kemasan (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={packagingCost}
                        onFocus={handleNumberInputFocus}
                        onChange={(e) => {
                          const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0 });
                          e.target.value = stringValue;
                          setPackagingCost(numericValue);
                        }}
                        className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                        Margin (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={targetProfitPct}
                        onFocus={handleNumberInputFocus}
                        onChange={(e) => {
                          const { stringValue, numericValue } = sanitizeNumericInput(e.target.value, { min: 0, max: 90, allowDecimals: true });
                          e.target.value = stringValue;
                          setTargetProfitPct(numericValue);
                        }}
                        className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-600">
                      Total Modal: <strong>{formatRupiah(hppCost + packagingCost)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const totalModal = hppCost + packagingCost;
                        const marginFrac = Math.min(0.9, Math.max(0, targetProfitPct / 100));
                        const computedOffline = Math.ceil((totalModal / (1 - marginFrac)) / 500) * 500;
                        setTargetOfflinePrice(computedOffline);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer"
                    >
                      Gunakan Rp {(Math.ceil(((hppCost + packagingCost) / (1 - Math.min(0.9, Math.max(0, targetProfitPct / 100)))) / 500) * 500).toLocaleString('id-ID')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Price with Recommend Action */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="add-display-price" className="block font-semibold text-slate-700">
                  Harga Jual di Aplikasi ({isGrab ? 'GrabFood' : 'GoFood'})
                </label>
                <button
                  type="button"
                  onClick={handleApplyRecommended}
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-900 hover:text-slate-600 underline underline-offset-2 cursor-pointer tabular-nums"
                >
                  <span>
                    Gunakan Rekomendasi ({formatRupiah(recommendation.roundedRecommendedPrice)})
                  </span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 select-none">
                  Rp
                </span>
                <input
                  id="add-display-price"
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
                  className="w-full text-sm font-semibold pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 tabular-nums bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Discount Settings */}
            <div>
              <label htmlFor="add-discount-type" className="block font-semibold text-slate-700 mb-1.5">
                Tipe Diskon
              </label>
              <select
                id="add-discount-type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 cursor-pointer"
              >
                <option value="PERCENT">Persentase (%)</option>
                <option value="NOMINAL">Nominal (Rp)</option>
              </select>
            </div>

            <div>
              <label htmlFor="add-discount-val" className="block font-semibold text-slate-700 mb-1.5">
                Nilai Diskon ({discountType === 'PERCENT' ? '%' : 'Rp'})
              </label>
              <input
                id="add-discount-val"
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
                className="w-full font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 tabular-nums bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Platform Booster (GrabFood) or Subsidi Gojek (GoFood) */}
            {isGrab ? (
              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Program PUAS (Grab Marketing Booster)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Biaya pemasaran tambahan +{presets.marketingBoosterPct}% dari subtotal setelah diskon
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
              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Skema Maksimal PRO (GoFood)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Gojek mensubsidi {gojekSubsidyPct}%, resto menanggung {100 - gojekSubsidyPct}% diskon
                  </span>
                </div>
                <select
                  aria-label="Subsidi Gojek"
                  value={gojekSubsidyPct}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setGojekSubsidyPct(Number.isNaN(parsed) ? 25 : parsed);
                  }}
                  className="font-semibold text-slate-900 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={25}>Subsidi 25% (Mitra 75%)</option>
                  <option value={30}>Subsidi 30% (Mitra 70%)</option>
                  <option value={0}>0% (Mandiri 100%)</option>
                  <option value={50}>50% (50/50)</option>
                </select>
              </div>
            )}

            {/* Live Calculation Margin Preview */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
              {!isGrab && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-200/70">
                  <span>
                    Potongan GoFood (Layanan {formatRupiah(forwardCalc.platformFee)} + Promo Mitra {formatRupiah(forwardCalc.mitraPromoShare ?? 0)})
                  </span>
                  <span className="font-semibold text-slate-700 tabular-nums">
                    -{formatRupiah(forwardCalc.totalPlatformDeduction)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estimasi Net Payout</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(forwardCalc.netPayout)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Selisih vs Target</span>
                <span
                  className={`font-semibold tabular-nums ${
                    forwardCalc.variance < 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatRupiah(forwardCalc.variance, true)}{' '}
                  ({forwardCalc.variance < 0 ? 'Defisit' : 'Aman'})
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="add-menu-notes" className="block font-semibold text-slate-700 mb-1.5">
                Catatan (Opsional)
              </label>
              <input
                id="add-menu-notes"
                type="text"
                placeholder="Misal: Paket makan siang, porsi reguler..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Form Actions */}
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
              Simpan Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
