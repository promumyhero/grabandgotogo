'use client';

import React, { useState } from 'react';
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
import { X, Plus, Sparkles } from 'lucide-react';

interface AddMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: WorkspaceChannel;
  presets: GlobalPresets;
  onAddMenuItem: (newItem: MenuItem) => void;
}

export function AddMenuModal({
  isOpen,
  onClose,
  channel,
  presets,
  onAddMenuItem,
}: AddMenuModalProps) {
  const isGrab = channel === 'GRABFOOD';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan Utama');
  const [targetOfflinePrice, setTargetOfflinePrice] = useState<number>(30000);
  const [displayPrice, setDisplayPrice] = useState<number>(60000);
  const [discountType, setDiscountType] = useState<DiscountType>(presets.merchantDiscountType);
  const [discountValue, setDiscountValue] = useState<number>(presets.merchantDiscountValue);
  const [isBoosterActive, setIsBoosterActive] = useState<boolean>(
    isGrab ? presets.isBoosterActiveDefault : false
  );
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const forwardCalc = calculateForward(
    displayPrice,
    targetOfflinePrice,
    discountType,
    discountValue,
    presets.platformCommissionPct,
    presets.marketingBoosterPct,
    isBoosterActive
  );

  const recommendation = calculateRecommendedPrice(
    targetOfflinePrice,
    discountType,
    discountValue,
    presets.platformCommissionPct,
    presets.marketingBoosterPct,
    isBoosterActive,
    presets.roundingRule
  );

  const handleApplyRecommended = () => {
    setDisplayPrice(recommendation.roundedRecommendedPrice);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: MenuItem = {
      id: `${channel.toLowerCase()}-${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'Makanan Utama',
      channel,
      targetOfflinePrice: Math.round(targetOfflinePrice),
      displayPrice: Math.round(displayPrice),
      merchantDiscountType: discountType,
      merchantDiscountValue: Number(discountValue),
      platformCommissionPct: presets.platformCommissionPct,
      marketingBoosterPct: presets.marketingBoosterPct,
      isBoosterActive,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddMenuItem(newItem);
    onClose();
    setName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Tambah Menu Baru ({isGrab ? 'GrabFood' : 'GoFood'})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulasikan margin sebelum mendaftarkan menu ke aplikasi delivery
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Menu Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Menu Makanan / Minuman <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Nasi Goreng Spesial Telur Ceplok"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Makanan Utama">Makanan Utama</option>
                <option value="Paket Nasi">Paket Nasi</option>
                <option value="Menu Spesial">Menu Spesial</option>
                <option value="Minuman">Minuman</option>
                <option value="Camilan / Snack">Camilan / Snack</option>
              </select>
            </div>

            {/* Target Offline Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Payout Bersih Offline (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={targetOfflinePrice || ''}
                  onChange={(e) => setTargetOfflinePrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-semibold pl-9 pr-3 py-2 border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                />
              </div>
            </div>

            {/* Display Price with Ideal Recommender button */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Harga Tampilan Aplikasi (Rp)
                </label>
                <button
                  type="button"
                  onClick={handleApplyRecommended}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Pakai Rekomendasi ({formatRupiah(recommendation.roundedRecommendedPrice)})
                  </span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={displayPrice || ''}
                  onChange={(e) => setDisplayPrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-semibold pl-9 pr-3 py-2 border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                />
              </div>
            </div>

            {/* Merchant Discount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diskon Mitra Resto
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="text-xs font-medium px-2 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
                >
                  <option value="PERCENT">% Persen</option>
                  <option value="NOMINAL">Rp Nominal</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-semibold px-3 py-2 border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                />
              </div>
            </div>

            {/* Booster Toggle (for GrabFood) */}
            {isGrab && (
              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PUAS Booster (14%)
                </label>
                <button
                  type="button"
                  onClick={() => setIsBoosterActive(!isBoosterActive)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isBoosterActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <span>Biaya Sukses Pemasaran</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isBoosterActive ? 'bg-[#00B14F] text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isBoosterActive ? 'AKTIF (14%)' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Real-time Calculation Summary Card */}
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              forwardCalc.variance < 0
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>Preview Payout Bersih:</span>
              <span className="text-base tabular-nums">
                {formatRupiah(forwardCalc.netPayout)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Potongan Komisi & Booster:</span>
              <span className="tabular-nums font-semibold">
                -{formatRupiah(forwardCalc.totalPlatformDeduction)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-current/10 font-semibold">
              <span>Margin vs Target ({formatRupiah(targetOfflinePrice)}):</span>
              <span className="tabular-nums">
                {formatRupiah(forwardCalc.variance, true)}{' '}
                {forwardCalc.variance < 0 ? '(⚠️ Boncos)' : '(✅ Aman)'}
              </span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
