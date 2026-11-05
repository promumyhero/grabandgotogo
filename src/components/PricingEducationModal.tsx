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
import { X, BookOpen, Calculator, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PricingEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingEducationModal({
  isOpen,
  onClose,
}: PricingEducationModalProps) {
  const [activeTab, setActiveTab] = useState<'comparison' | 'formula' | 'simulator'>('comparison');

  // Interactive Side-by-Side Simulator State
  const [simOfflinePrice, setSimOfflinePrice] = useState<number>(30000);
  const [simDiscountPct, setSimDiscountPct] = useState<number>(25);
  const [simGrabBooster, setSimGrabBooster] = useState<boolean>(true);
  const [simGojekSubsidyPct, setSimGojekSubsidyPct] = useState<number>(25);
  const [simTestDisplayPrice, setSimTestDisplayPrice] = useState<number>(50000);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="education-modal-title"
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="education-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Panduan & Bedah Rumus Komisi: GrabFood vs GoFood
              </h2>
              <p className="text-xs text-slate-500">
                Terverifikasi dari struk penyelesaian merchant nyata (GF-957 & GoBiz F-3388856614)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan perhitungan"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-200 bg-slate-50/60 flex gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'comparison'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Perbedaan Cara Hitung GrabFood vs GoFood
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('formula')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'formula'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            2. Rumus Harga Tayang Aman (Anti-Boncos)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            3. Simulator Perbandingan Langsung
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
          {activeTab === 'comparison' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-900">
                  <strong className="font-bold block mb-0.5">
                    Mengapa Banyak Resto Boncos Tanpa Sadar?
                  </strong>
                  Kesalahan paling umum pemilik resto adalah menaikkan harga dari Harga Offline dengan cara ditambah persentase langsung (misal: Target Rp 30.000 + Komisi 20% + Diskon 30% = dinaikkan 50% jadi Rp 45.000). Padahal, platform memotong komisi dan diskon dari <strong>Harga Tayang Atas (Display Price)</strong>, sehingga jika dipasang Rp 45.000, uang bersih yang cair hanya sekitar Rp 20.790 (Boncos -Rp 9.210 per porsi!).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GrabFood Card */}
                <div className="rounded-xl border border-slate-200 p-5 bg-white">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-emerald-800">
                      Cara Hitung GrabFood (Net-Base)
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                      Basis: Setelah Diskon
                    </span>
                  </div>

                  <ol className="space-y-2.5 text-xs leading-relaxed">
                    <li>
                      <strong className="text-slate-900">1. Diskon Merchant Dipotong Lebih Dulu:</strong>
                      <div className="mt-1 p-2 rounded bg-slate-50 font-mono text-[11px] text-slate-800">
                        Subtotal = Harga Tayang - Diskon Merchant
                      </div>
                    </li>
                    <li>
                      <strong className="text-slate-900">2. Komisi Platform (20%) dari Subtotal:</strong>
                      <p className="text-slate-500 mt-0.5">
                        Grab menghitung komisi 20% dari <em>Subtotal Setelah Diskon</em>, bukan dari harga tayang awal.
                      </p>
                    </li>
                    <li>
                      <strong className="text-slate-900">3. Biaya Sukses Pemasaran / Booster (14%):</strong>
                      <p className="text-slate-500 mt-0.5">
                        Jika mengikuti kampanye visibilitas/PUAS (14%), potongannya juga dihitung dari <em>Subtotal Setelah Diskon</em> (dibulatkan ke bawah / <code>Math.floor</code>).
                      </p>
                    </li>
                    <li>
                      <strong className="text-slate-900">4. Pencairan Bersih (Net Payout):</strong>
                      <div className="mt-1 p-2 rounded bg-emerald-50/70 border border-emerald-200 font-mono text-[11px] text-emerald-950">
                        Nett = Subtotal - Komisi (20%) - Booster (14%)
                      </div>
                    </li>
                  </ol>
                </div>

                {/* GoFood Card */}
                <div className="rounded-xl border border-slate-200 p-5 bg-white">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-rose-800">
                      Cara Hitung GoFood / GoBiz (Co-Funded)
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 rounded border border-rose-200">
                      Basis: Subsidi + Biaya Rp {GOFOOD_FIXED_FEE}
                    </span>
                  </div>

                  <ol className="space-y-2.5 text-xs leading-relaxed">
                    <li>
                      <strong className="text-slate-900">1. Pembagian Beban Promo (Co-Funding):</strong>
                      <p className="text-slate-500 mt-0.5">
                        Pada kampanye seperti <em>Maksimal PRO</em>, diskon konsumen dibagi dua: misal <strong>Gojek mensubsidi 25%</strong>, dan <strong>Mitra Usaha menanggung 75%</strong> sisanya.
                      </p>
                    </li>
                    <li>
                      <strong className="text-slate-900">2. Biaya Layanan GoFood Delivery (20% + Rp {GOFOOD_FIXED_FEE}):</strong>
                      <div className="mt-1 p-2 rounded bg-slate-50 font-mono text-[11px] text-slate-800">
                        Biaya Layanan = 20% × (Harga Tayang - Beban Promo Mitra) + Rp {GOFOOD_FIXED_FEE}
                      </div>
                    </li>
                    <li>
                      <strong className="text-slate-900">3. Mengapa GoFood Terasa Berbeda?</strong>
                      <p className="text-slate-500 mt-0.5">
                        Karena Gojek memberikan subsidi (misal 25%), dasar pengenaan komisi 20% di GoFood lebih tinggi sebesar porsi subsidi Gojek ditambah komponen tetap Rp {GOFOOD_FIXED_FEE} per transaksi.
                      </p>
                    </li>
                    <li>
                      <strong className="text-slate-900">4. Total Pendapatan Bersih (GoBiz):</strong>
                      <div className="mt-1 p-2 rounded bg-rose-50/70 border border-rose-200 font-mono text-[11px] text-rose-950">
                        Nett = Harga Tayang - Beban Promo Mitra - Biaya Layanan
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formula' && (
            <div className="space-y-5 text-xs leading-relaxed">
              <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/60">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Bagaimana Kalkulator Ini Mencari &ldquo;Harga Tayang Aman&rdquo; (Mode Reverse)?
                </h3>
                <p className="text-slate-600 mb-4">
                  Agar uang bersih yang masuk ke rekening resto (<strong>Net Payout</strong>) tidak pernah kurang dari <strong>Target Harga Offline</strong> Anda, aplikasi ini melakukan perhitungan terbalik (<em>Reverse-Engineering</em>) lalu memverifikasinya hingga presisi Rp 1:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="font-bold text-emerald-800 mb-1.5">
                      Rumus Balik GrabFood (Diskon Persen)
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 text-slate-100 font-mono text-[11px] mb-2">
                      SubtotalWajib = TargetOffline / (1 - (Komisi% + Booster%))
                      <br />
                      HargaTayang = SubtotalWajib / (1 - Diskon%)
                    </div>
                    <p className="text-slate-500">
                      <strong>Contoh:</strong> Target Offline Rp 30.000, Diskon 30%, Komisi 20% + Booster 14% (Total potongan 34% dari subtotal):
                      <br />• Subtotal Wajib = Rp 30.000 / (1 - 0,34) = Rp 45.455
                      <br />• Harga Tayang Eksak = Rp 45.455 / (1 - 0,30) = <strong>Rp 64.936</strong>
                      <br />• Dibulatkan ke Rp 500 terdekat = <strong>Rp 65.000</strong> (Nett cair Rp 30.030, Surplus +Rp 30).
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="font-bold text-rose-800 mb-1.5">
                      Rumus Balik GoFood (Co-Funded Promo)
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 text-slate-100 font-mono text-[11px] mb-2">
                      BasisWajib = (TargetOffline + 800) / (1 - Komisi%)
                      <br />
                      BebanMitra% = Diskon% × (1 - SubsidiGojek%)
                      <br />
                      HargaTayang = BasisWajib / (1 - BebanMitra%)
                    </div>
                    <p className="text-slate-500">
                      <strong>Contoh:</strong> Target Offline Rp 28.000, Diskon Konsumen 20%, Subsidi Gojek 25% (Beban Mitra = 15%), Komisi 20%:
                      <br />• Basis Wajib = (Rp 28.000 + 800) / 0,80 = Rp 36.000
                      <br />• Harga Tayang Eksak = Rp 36.000 / (1 - 0,15) = <strong>Rp 42.353</strong>
                      <br />• Dibulatkan ke Rp 500 terdekat = <strong>Rp 42.500</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <h4 className="font-bold text-slate-900 mb-1.5">
                  Tips Memilih Aturan Pembulatan (Rounding Rule)
                </h4>
                <ul className="space-y-1.5 text-slate-600">
                  <li>
                    • <strong>Ke Atas Kelipatan Rp 500 (Direkomendasikan):</strong> Membuat harga di aplikasi terlihat wajar bagi pelanggan (misal Rp 32.500 atau Rp 48.000) sekaligus memberi cadangan surplus Rp 100–Rp 400 per porsi.
                  </li>
                  <li>
                    • <strong>Ke Atas Kelipatan Rp 1.000:</strong> Cocok untuk menu paket keluarga/katering agar angka bulat penuh.
                  </li>
                  <li>
                    • <strong>Harga Eksak (Rp 1):</strong> Gunakan saat Anda mencocokkan angka persis dengan struk riwayat transaksi yang memiliki nominal ganjil.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-5">
              {/* Simulator Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Target Nett Offline (Rp)
                  </label>
                  <input
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
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Harga Tayang Uji Coba (Rp)
                  </label>
                  <input
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
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Diskon Konsumen (%)
                  </label>
                  <input
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
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Subsidi Gojek / Booster Grab
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSimGrabBooster((p) => !p)}
                      className={`px-2.5 py-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        simGrabBooster
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      Booster {simGrabBooster ? '14% ON' : 'OFF'}
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={simGojekSubsidyPct}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const { stringValue, numericValue } = sanitizeNumericInput(
                          e.target.value,
                          { min: 0, max: 100, allowDecimals: true }
                        );
                        e.target.value = stringValue;
                        setSimGojekSubsidyPct(numericValue);
                      }}
                      aria-label="Subsidi Gojek Persen"
                      className="w-16 px-2 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Side by Side Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GrabFood Column */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900">
                      Simulasi di GrabFood
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                        grabForward.isLoss
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
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
                    <span className="text-slate-500">Harga Tayang Uji:</span>
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
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between mt-2">
                    <span className="text-emerald-900 font-medium">
                      Harga Tayang Aman GrabFood:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSimTestDisplayPrice(grabRec.roundedRecommendedPrice)
                      }
                      className="font-bold text-emerald-800 underline cursor-pointer"
                    >
                      {formatRupiah(grabRec.roundedRecommendedPrice)} (Klik Uji)
                    </button>
                  </div>
                </div>

                {/* GoFood Column */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900">
                      Simulasi di GoFood (Subsidi {simGojekSubsidyPct}%)
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                        gofoodForward.isLoss
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
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
                    <span className="text-slate-500">Harga Tayang Uji:</span>
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
                  <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 flex items-center justify-between mt-2">
                    <span className="text-rose-900 font-medium">
                      Harga Tayang Aman GoFood:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSimTestDisplayPrice(gofoodRec.roundedRecommendedPrice)
                      }
                      className="font-bold text-rose-800 underline cursor-pointer"
                    >
                      {formatRupiah(gofoodRec.roundedRecommendedPrice)} (Klik Uji)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Seluruh rumus di atas bekerja otomatis di setiap baris menu resto Anda.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Mengerti & Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
