'use client';

import React, { useState, useEffect } from 'react';
import {
  calculateForward,
  calculateRecommendedPrice,
  formatRupiah,
  GOFOOD_FIXED_FEE,
} from '@/lib/pricing-engine';
import {
  sanitizeNumericInput,
  handleNumberInputFocus,
} from '@/lib/input-utils';
import {
  X,
  BookOpen,
  Calculator,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
} from 'lucide-react';

interface PricingEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OFFLINE_QUICK_PRESETS = [20000, 28000, 35000, 50000];
const DISCOUNT_QUICK_PRESETS = [0, 15, 25, 30];

export function PricingEducationModal({
  isOpen,
  onClose,
}: PricingEducationModalProps) {
  const [activeTab, setActiveTab] = useState<'comparison' | 'formula' | 'simulator'>('comparison');
  // Mobile platform filter on Tab 1 so small phone screens don't feel cluttered
  const [mobilePlatformView, setMobilePlatformView] = useState<'BOTH' | 'GRAB' | 'GOFOOD'>('BOTH');

  // Interactive Side-by-Side Simulator State
  const [simOfflinePrice, setSimOfflinePrice] = useState<number>(28000);
  const [simDiscountPct, setSimDiscountPct] = useState<number>(25);
  const [simGrabBooster, setSimGrabBooster] = useState<boolean>(true);
  const [simGojekSubsidyPct, setSimGojekSubsidyPct] = useState<number>(25);
  const [simTestDisplayPrice, setSimTestDisplayPrice] = useState<number>(48000);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Live Simulator Calculations
  const grabForward = calculateForward(
    simTestDisplayPrice,
    simOfflinePrice,
    'PERCENT',
    simDiscountPct,
    20,
    14,
    simGrabBooster,
    'GRABFOOD'
  );
  const grabRec = calculateRecommendedPrice(
    simOfflinePrice,
    'PERCENT',
    simDiscountPct,
    20,
    14,
    simGrabBooster,
    'CEIL_500',
    'GRABFOOD'
  );

  const gofoodForward = calculateForward(
    simTestDisplayPrice,
    simOfflinePrice,
    'PERCENT',
    simDiscountPct,
    20,
    0,
    false,
    'GOFOOD',
    simGojekSubsidyPct,
    true
  );
  const gofoodRec = calculateRecommendedPrice(
    simOfflinePrice,
    'PERCENT',
    simDiscountPct,
    20,
    0,
    false,
    'CEIL_500',
    'GOFOOD',
    simGojekSubsidyPct,
    true
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 lg:p-6 animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="education-modal-title"
        className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-sheet-panel"
      >
        {/* Mobile Bottom-Sheet Drag Handle Affordance */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 bg-white shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="education-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900 truncate"
              >
                Panduan & Bedah Rumus: GrabFood vs GoFood
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Berdasarkan struk penyelesaian nyata GrabMerchant (GF-957) & GoBiz (F-3388856614)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan perhitungan"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile-First 3-Column Segmented Control Tab Bar (Never overflows on 320px phones) */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div
            role="tablist"
            aria-label="Bagian panduan perhitungan"
            className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'comparison'}
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span className="truncate">1. Grab vs GoFood</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'formula'}
              onClick={() => setActiveTab('formula')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'formula'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span className="truncate">2. Rumus Aman</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'simulator'}
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span className="truncate">3. Simulator</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 flex-1">
          {/* ==========================================
              TAB 1: PERBANDINGAN GRABFOOD VS GOFOOD
          ========================================== */}
          {activeTab === 'comparison' && (
            <div className="space-y-4 sm:space-y-5 animate-tab-panel">
              {/* Key Takeaway Banner */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-950">
                  <strong className="font-bold block mb-0.5">
                    Jebakan Markup Biasa: Mengapa Tambah Persentase Langsung Selalu Rugi?
                  </strong>
                  Jika Harga Offline Anda <strong>Rp 30.000</strong> lalu Anda memberi diskon 30% + komisi 20% dengan cara menaikkan harga +50% menjadi <strong>Rp 45.000</strong>, maka potongan 50% dihitung dari Rp 45.000 (bukan dari Rp 30.000!). Akibatnya uang yang cair hanya <strong>Rp 20.790</strong> (Boncos <strong>-Rp 9.210</strong> per porsi).
                </div>
              </div>

              {/* Mobile-Only Platform Switcher so phone screens stay clean */}
              <div className="flex md:hidden items-center justify-between bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMobilePlatformView('BOTH')}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer ${
                    mobilePlatformView === 'BOTH'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Tampilkan Semua
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePlatformView('GRAB')}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer ${
                    mobilePlatformView === 'GRAB'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Khusus GrabFood
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePlatformView('GOFOOD')}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer ${
                    mobilePlatformView === 'GOFOOD'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Khusus GoFood
                </button>
              </div>

              {/* Responsive 1-col (Mobile) / 2-col (Tablet & Desktop) Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GRABFOOD VISUAL FLOW CARD */}
                <div
                  className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between ${
                    mobilePlatformView === 'GOFOOD' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">
                          Cara Hitung GrabFood
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Basis Komisi: <strong>Harga Setelah Diskon</strong>
                        </span>
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 shrink-0">
                        Net-Base
                      </span>
                    </div>

                    {/* Step 1 */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>1. Kurangi Diskon Merchant Dulu</span>
                        <span className="text-emerald-700">Subtotal Bersih</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Harga Tayang dikurangi Diskon Merchant menghasilkan <strong>Subtotal Setelah Diskon</strong>.
                      </p>
                    </div>

                    <div className="flex justify-center text-slate-300 -my-1">
                      <ArrowDown className="w-4 h-4" />
                    </div>

                    {/* Step 2 */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>2. Potong Komisi (20%) & Booster (14%)</span>
                        <span className="text-rose-600">-34% dari Subtotal</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Komisi 20% dan Booster Pemasaran 14% keduanya dihitung dari <strong>Subtotal Setelah Diskon</strong>, bukan dari harga tayang awal.
                      </p>
                    </div>

                    <div className="flex justify-center text-slate-300 -my-1">
                      <ArrowDown className="w-4 h-4" />
                    </div>

                    {/* Step 3: Contoh Nyata */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 text-xs">
                      <div className="font-bold text-emerald-950">
                        Contoh Struk Nyata GrabFood (Order GF-957):
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-900">
                        <span>Harga Tayang Rp 64.400 - Diskon 30%:</span>
                        <span className="font-semibold">Subtotal Rp 45.080</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-900">
                        <span>Potongan Grab 20% + Booster 14%:</span>
                        <span className="font-semibold text-rose-700">-Rp 15.327</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-emerald-200/80 font-bold text-emerald-950">
                        <span>Uang Bersih Cair ke Resto:</span>
                        <span>Rp 29.753</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GOFOOD VISUAL FLOW CARD */}
                <div
                  className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between ${
                    mobilePlatformView === 'GRAB' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">
                          Cara Hitung GoFood (GoBiz)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Basis: <strong>Subsidi Bersama + Rp {GOFOOD_FIXED_FEE}</strong>
                        </span>
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-800 rounded-md border border-rose-200 shrink-0">
                        Co-Funded
                      </span>
                    </div>

                    {/* Step 1 */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>1. Bagi Beban Diskon (Mitra vs Gojek)</span>
                        <span className="text-rose-700">Mitra 75% : Gojek 25%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Pada promo <em>Maksimal PRO</em>, Gojek mensubsidi misal <strong>25%</strong> dari diskon konsumen, dan Mitra menanggung <strong>75%</strong> sisanya.
                      </p>
                    </div>

                    <div className="flex justify-center text-slate-300 -my-1">
                      <ArrowDown className="w-4 h-4" />
                    </div>

                    {/* Step 2 */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>2. Biaya Layanan 20% + Rp {GOFOOD_FIXED_FEE}</span>
                        <span className="text-rose-600">20% + Rp {GOFOOD_FIXED_FEE}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Komisi 20% dikalikan dengan <strong>(Harga Tayang dikurangi Beban Promo Mitra)</strong> lalu ditambah biaya tetap <strong>Rp {GOFOOD_FIXED_FEE}</strong>.
                      </p>
                    </div>

                    <div className="flex justify-center text-slate-300 -my-1">
                      <ArrowDown className="w-4 h-4" />
                    </div>

                    {/* Step 3: Contoh Nyata */}
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5 text-xs">
                      <div className="font-bold text-rose-950">
                        Contoh Struk Nyata GoBiz (Order F-3388856614):
                      </div>
                      <div className="flex justify-between text-[11px] text-rose-900">
                        <span>Penjualan Rp 45.950 (Diskon Rp 4.600):</span>
                        <span className="font-semibold">Beban Mitra -Rp 3.450</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-rose-900">
                        <span>Biaya Layanan 20% × Rp 42.500 + Rp 800:</span>
                        <span className="font-semibold text-rose-700">-Rp 9.300</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-rose-200/80 font-bold text-rose-950">
                        <span>Total Pendapatan Bersih:</span>
                        <span>Rp 33.200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: RUMUS HARGA TAYANG AMAN (REVERSE)
          ========================================== */}
          {activeTab === 'formula' && (
            <div className="space-y-4 sm:space-y-5 text-xs leading-relaxed animate-tab-panel">
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Cara Kerja Mesin &ldquo;Harga Tayang Aman&rdquo; (Reverse-Engineering)
                  </h3>
                  <p className="text-slate-600 mt-1">
                    Daripada menebak-nebak harga jual, kalkulator ini bekerja terbalik dari <strong>Target Uang Bersih (Offline)</strong> yang ingin Anda terima di dapur:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GrabFood Formula Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 text-xs sm:text-sm">
                        Rumus Balik GrabFood
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Akurasi Rp 1
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Tahap A — Cari Subtotal Wajib
                        </span>
                        <span className="font-semibold text-slate-900 block mt-0.5">
                          Target Offline ÷ (100% - Total Komisi & Booster%)
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Tahap B — Cari Harga Tayang Sebelum Diskon
                        </span>
                        <span className="font-semibold text-slate-900 block mt-0.5">
                          Subtotal Wajib ÷ (100% - Diskon Merchant%)
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1">
                      Contoh: Target Rp 30.000 dengan Komisi+Booster 34% dan Diskon 30% membutuhkan Harga Tayang minimal <strong>Rp 65.000</strong> (pembulatan Rp 500) agar uang cair bersih <strong>Rp 30.030</strong>.
                    </p>
                  </div>

                  {/* GoFood Formula Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-800 text-xs sm:text-sm">
                        Rumus Balik GoFood
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Termasuk +Rp {GOFOOD_FIXED_FEE}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Tahap A — Tutup Komisi & Biaya Tetap Rp {GOFOOD_FIXED_FEE}
                        </span>
                        <span className="font-semibold text-slate-900 block mt-0.5">
                          (Target Offline + Rp {GOFOOD_FIXED_FEE}) ÷ (100% - Komisi 20%)
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Tahap B — Tutup Porsi Beban Promo Mitra
                        </span>
                        <span className="font-semibold text-slate-900 block mt-0.5">
                          Basis Wajib ÷ (100% - (Diskon% × Porsi Mitra%))
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1">
                      Contoh: Target Rp 28.000 dengan Diskon 20% (Subsidi Gojek 25%, Beban Mitra 15%) membutuhkan Harga Tayang <strong>Rp 42.500</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rounding Rule Guide */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Panduan Memilih Aturan Pembulatan Harga (Rounding Rule)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-900 block">
                      Ke Atas Rp 500 (Rekomendasi)
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Mengubah Rp 42.120 menjadi Rp 42.500. Terlihat rapi di aplikasi & memberi surplus tipis.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-900 block">
                      Ke Atas Rp 1.000
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Mengubah Rp 42.120 menjadi Rp 43.000. Cocok untuk menu paket atau porsi besar.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-slate-900 block">
                      Harga Eksak (Rp 1)
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Tanpa pembulatan, cocok saat mencocokkan angka persis dengan struk riwayat pesanan.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: SIMULATOR PERBANDINGAN LANGSUNG
          ========================================== */}
          {activeTab === 'simulator' && (
            <div className="space-y-4 sm:space-y-5 animate-tab-panel">
              {/* Touch-Friendly Simulator Controls */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Target Offline Input + Quick Chips */}
                  <div>
                    <label
                      htmlFor="sim-offline-input"
                      className="block text-[11px] font-semibold text-slate-700 mb-1"
                    >
                      Target Bersih Offline (Rp)
                    </label>
                    <input
                      id="sim-offline-input"
                      type="number"
                      min="0"
                      value={simOfflinePrice}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const { stringValue, numericValue } = sanitizeNumericInput(
                          e.target.value,
                          { min: 0 }
                        );
                        e.target.value = stringValue;
                        setSimOfflinePrice(numericValue);
                      }}
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {OFFLINE_QUICK_PRESETS.map((presetVal) => (
                        <button
                          key={presetVal}
                          type="button"
                          onClick={() => setSimOfflinePrice(presetVal)}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded border cursor-pointer ${
                            simOfflinePrice === presetVal
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {presetVal / 1000}rb
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Harga Tayang Uji Coba */}
                  <div>
                    <label
                      htmlFor="sim-display-input"
                      className="block text-[11px] font-semibold text-slate-700 mb-1"
                    >
                      Harga Tayang Uji Coba (Rp)
                    </label>
                    <input
                      id="sim-display-input"
                      type="number"
                      min="0"
                      value={simTestDisplayPrice}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const { stringValue, numericValue } = sanitizeNumericInput(
                          e.target.value,
                          { min: 0 }
                        );
                        e.target.value = stringValue;
                        setSimTestDisplayPrice(numericValue);
                      }}
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSimTestDisplayPrice(grabRec.roundedRecommendedPrice)
                        }
                        className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer"
                      >
                        Aman Grab ({formatRupiah(grabRec.roundedRecommendedPrice)})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSimTestDisplayPrice(gofoodRec.roundedRecommendedPrice)
                        }
                        className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-800 border border-rose-200 cursor-pointer"
                      >
                        Aman GoFood ({formatRupiah(gofoodRec.roundedRecommendedPrice)})
                      </button>
                    </div>
                  </div>

                  {/* Diskon Konsumen + Quick Chips */}
                  <div>
                    <label
                      htmlFor="sim-discount-input"
                      className="block text-[11px] font-semibold text-slate-700 mb-1"
                    >
                      Diskon Promo (%)
                    </label>
                    <input
                      id="sim-discount-input"
                      type="number"
                      min="0"
                      max="90"
                      value={simDiscountPct}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const { stringValue, numericValue } = sanitizeNumericInput(
                          e.target.value,
                          { min: 0, max: 90, allowDecimals: true }
                        );
                        e.target.value = stringValue;
                        setSimDiscountPct(numericValue);
                      }}
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {DISCOUNT_QUICK_PRESETS.map((disc) => (
                        <button
                          key={disc}
                          type="button"
                          onClick={() => setSimDiscountPct(disc)}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded border cursor-pointer ${
                            simDiscountPct === disc
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {disc}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Booster Grab & Subsidi Gojek */}
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Opsi Kampanye Platform
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSimGrabBooster((p) => !p)}
                        className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          simGrabBooster
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Booster {simGrabBooster ? '14% ON' : 'OFF'}
                      </button>
                      <div className="relative w-24 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={simGojekSubsidyPct}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const { stringValue, numericValue } =
                              sanitizeNumericInput(e.target.value, {
                                min: 0,
                                max: 100,
                                allowDecimals: true,
                              });
                            e.target.value = stringValue;
                            setSimGojekSubsidyPct(numericValue);
                          }}
                          aria-label="Subsidi Gojek Persen"
                          className="w-full pl-2.5 pr-6 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                          %Sub
                        </span>
                      </div>
                    </div>
                    <span className="block text-[10px] text-slate-500 mt-1.5">
                      Booster Grab 14% • Subsidi GoFood {simGojekSubsidyPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Side by Side Comparison Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GrabFood Result Card */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">
                      Hasil di GrabFood
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                        grabForward.isLoss
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {grabForward.isLoss ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {grabForward.isLoss ? 'Boncos' : 'Margin Aman'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Harga Tayang Diuji:</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(simTestDisplayPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Diskon Merchant ({simDiscountPct}%):
                    </span>
                    <span className="text-rose-600 font-medium">
                      -{formatRupiah(grabForward.discountAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Komisi 20% + Booster {simGrabBooster ? '14%' : '0%'}:
                    </span>
                    <span className="text-rose-600 font-medium">
                      -{formatRupiah(grabForward.totalPlatformDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm">
                    <span className="text-slate-900">Nett Cair ke Resto:</span>
                    <span
                      className={
                        grabForward.isLoss ? 'text-rose-600' : 'text-emerald-700'
                      }
                    >
                      {formatRupiah(grabForward.netPayout)} (
                      {formatRupiah(grabForward.variance, true)})
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 mt-2">
                    <div>
                      <span className="text-[11px] text-emerald-900 block">
                        Rekomendasi Harga Aman GrabFood:
                      </span>
                      <span className="text-sm font-bold text-emerald-950">
                        {formatRupiah(grabRec.roundedRecommendedPrice)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSimTestDisplayPrice(grabRec.roundedRecommendedPrice)
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      Uji Harga Ini
                    </button>
                  </div>
                </div>

                {/* GoFood Result Card */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">
                      Hasil di GoFood (Subsidi {simGojekSubsidyPct}%)
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                        gofoodForward.isLoss
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {gofoodForward.isLoss ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {gofoodForward.isLoss ? 'Boncos' : 'Margin Aman'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Harga Tayang Diuji:</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(simTestDisplayPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Beban Promo Mitra ({100 - simGojekSubsidyPct}% dari diskon):
                    </span>
                    <span className="text-rose-600 font-medium">
                      -{formatRupiah(gofoodForward.mitraPromoShare ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Biaya Layanan GoFood (20% + Rp {GOFOOD_FIXED_FEE}):
                    </span>
                    <span className="text-rose-600 font-medium">
                      -{formatRupiah(gofoodForward.platformFee)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm">
                    <span className="text-slate-900">Nett Cair ke Resto:</span>
                    <span
                      className={
                        gofoodForward.isLoss ? 'text-rose-600' : 'text-emerald-700'
                      }
                    >
                      {formatRupiah(gofoodForward.netPayout)} (
                      {formatRupiah(gofoodForward.variance, true)})
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-2 mt-2">
                    <div>
                      <span className="text-[11px] text-rose-900 block">
                        Rekomendasi Harga Aman GoFood:
                      </span>
                      <span className="text-sm font-bold text-rose-950">
                        {formatRupiah(gofoodRec.roundedRecommendedPrice)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSimTestDisplayPrice(gofoodRec.roundedRecommendedPrice)
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      Uji Harga Ini
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-500 truncate">
            Seluruh rumus di atas diterapkan otomatis pada tabel menu Anda.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
