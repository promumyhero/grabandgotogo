'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/types/pricing';
import {
  calculateForward,
  calculateRecommendedPrice,
  formatRupiah,
} from '@/lib/pricing-engine';
import {
  Store,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Layers,
  HeartHandshake,
  LogIn,
} from 'lucide-react';

interface LandingPageProps {
  authUser: AuthUser | null;
  onEnterCalculator: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenEducationModal: () => void;
}

export function LandingPage({
  authUser,
  onEnterCalculator,
  onOpenAuthModal,
  onOpenEducationModal,
}: LandingPageProps) {
  // Interactive Hero Preview State
  const [previewPlatform, setPreviewPlatform] = useState<'GRABFOOD' | 'GOFOOD'>('GRABFOOD');
  const targetOffline = 28000;
  const discountPct = 25;

  // Naive markup (Target + 25% = Rp 35.000) vs Reverse-Engineered Safe Price
  const naivePrice = 35000;
  const naiveResult = calculateForward(
    naivePrice,
    targetOffline,
    'PERCENT',
    discountPct,
    20,
    14,
    previewPlatform === 'GRABFOOD',
    previewPlatform,
    25,
    true
  );

  const safeRecommendation = calculateRecommendedPrice(
    targetOffline,
    'PERCENT',
    discountPct,
    20,
    14,
    previewPlatform === 'GRABFOOD',
    'CEIL_500',
    previewPlatform,
    25,
    true
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-950 block leading-none">
                FoodMerchant
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Pricing & Margin Engine
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#masalah-solusi" className="hover:text-slate-950 transition-colors">
              Mengapa Penting?
            </a>
            <a href="#cara-kerja" className="hover:text-slate-950 transition-colors">
              GrabFood vs GoFood
            </a>
            <a href="#harapan-umkm" className="hover:text-slate-950 transition-colors">
              Harapan Kami
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {authUser ? (
              <button
                type="button"
                onClick={onEnterCalculator}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <span>Buka Workspace ({authUser.name})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('login')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={onEnterCalculator}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Coba Kalkulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="bg-white border-b border-slate-200/80 py-10 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Editorial Pitch */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dikalibrasi dari Struk Penyelesaian Asli GrabMerchant & GoBiz</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-slate-950 leading-[1.18]">
                  Jangan Biarkan Promo Aplikasi Menggerus Margin Dapur Restoran Anda.
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  <strong>FoodMerchant Pricing Engine</strong> adalah alat bantu hitung harga jual online untuk pemilik warung, kafe, dan UMKM kuliner. Hitung mundur (<em>reverse-engineering</em>) harga tayang yang tepat di <strong>GrabFood</strong> dan <strong>GoFood</strong> agar pelanggan tetap senang dapat diskon, namun uang bersih yang cair ke rekening Anda <strong>100% utuh sesuai harga jual makan di tempat (offline)</strong>.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onEnterCalculator}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>
                      {authUser
                        ? 'Masuk ke Kalkulator Resto Saya'
                        : 'Buka Kalkulator (Mode Demo Gratis)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {!authUser && (
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal('register')}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <Store className="w-4 h-4 text-slate-700" />
                      <span>Daftar Akun Resto Gratis</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenEducationModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lihat Bedah Rumus</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Before vs After Proof Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Simulasi Nyata: Paket Ayam Bakar
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Target Bersih Dapur (Offline): <strong>Rp 28.000</strong> • Diskon Promo: <strong>25%</strong>
                      </span>
                    </div>

                    <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-[11px] font-semibold shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewPlatform('GRABFOOD')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          previewPlatform === 'GRABFOOD'
                            ? 'bg-white text-emerald-800 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        GrabFood
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewPlatform('GOFOOD')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          previewPlatform === 'GOFOOD'
                            ? 'bg-white text-rose-800 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        GoFood
                      </button>
                    </div>
                  </div>

                  {/* Card 1: Cara Lama (Boncos) */}
                  <div className="rounded-xl bg-white border border-rose-200 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        ✗ Cara Tebak Markup Biasa (+25%)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        Boncos {formatRupiah(naiveResult.variance)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Jika Harga Tayang hanya dipasang <strong>{formatRupiah(naivePrice)}</strong>, setelah dipotong diskon 25% dan komisi {previewPlatform === 'GRABFOOD' ? 'Grab 20% + Booster 14%' : 'GoFood 20% + beban promo'}, uang yang cair hanya:
                    </p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">Uang Bersih Masuk Rekening:</span>
                      <span className="font-bold text-rose-600">
                        {formatRupiah(naiveResult.netPayout)} (Rugi {formatRupiah(Math.abs(naiveResult.variance))}/porsi)
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Dengan Pricing Engine (Aman) */}
                  <div className="rounded-xl bg-white border border-emerald-200 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        ✓ Rekomendasi Pricing Engine
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Margin Aman ({formatRupiah(safeRecommendation.recommendedVariance, true)})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Agar uang bersih tetap cair minimal <strong>Rp 28.000</strong> setelah seluruh potongan {previewPlatform === 'GRABFOOD' ? 'GrabFood' : 'GoFood'}, Harga Tayang yang wajib dipasang adalah:
                    </p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">
                        Harga Tayang Aman: <strong>{formatRupiah(safeRecommendation.roundedRecommendedPrice)}</strong>
                      </span>
                      <span className="font-bold text-emerald-700">
                        Cair {formatRupiah(safeRecommendation.recommendedNetPayout)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INI UNTUK APA & MASALAH YANG DISELESAIKAN */}
        <section id="masalah-solusi" className="py-12 sm:py-16 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tujuan & Fungsi Utama
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mt-1">
                Dibuat Khusus untuk Menjawab 3 Kebingungan Terbesar Pemilik Resto
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Banyak warung dan restoran ramai pesanan di aplikasi, tetapi saat dihitung di akhir bulan justru tidak menyisakan laba. Ini penyebabnya dan bagaimana kami menyelesaikannya:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  01
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rumus GrabFood & GoFood Itu Berbeda
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Di <strong>GrabFood</strong>, komisi 20% dan Booster 14% dihitung dari <em>Harga Setelah Diskon</em>. Sebaliknya di <strong>GoFood</strong>, diskon promo dibagi antara subsidi Gojek dan beban mitra, lalu dikenakan biaya layanan 20% + Rp 800. Satu harga tayang yang aman di GrabFood belum tentu aman di GoFood.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  02
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Hitung Mundur Otomatis & Pembulatan Cantik
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Anda cukup memasukkan <strong>Target Uang Bersih (Harga Offline)</strong> atau menghitungnya dari <strong>HPP (Modal Bahan + Kemasan)</strong>. Mesin kami menghitung Harga Tayang paling pas dengan pembulatan ke Rp 500 atau Rp 1.000 terdekat agar tetap menarik di mata pembeli.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  03
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Akun Resto Pribadi & Template Promo Siap Pakai
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setiap pemilik resto dapat membuat akun sendiri, menyimpan daftar menu GrabFood & GoFood di Cloud, menyalin menu antar-platform dalam 1 klik, serta menyimpan <strong>Template Skema Promo Resto</strong> (seperti <em>Promo Gajian 30%</em> atau <em>Maksimal PRO 25%</em>).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. RINGKasan PERBANDINGAN GRABFOOD VS GOFOOD */}
        <section id="cara-kerja" className="py-12 sm:py-16 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transparansi Perhitungan
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950 mt-1">
                  Sekilas Perbedaan Potongan GrabFood vs GoFood
                </h2>
              </div>

              <button
                type="button"
                onClick={onOpenEducationModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Buka Panduan Lengkap & Simulator Interaktif</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-900">
                    Skema GrabFood (GrabMerchant)
                  </span>
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                    Komisi dari Harga Setelah Diskon
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li>
                    • <strong>Langkah 1:</strong> Harga Tayang dikurangi Diskon Merchant terlebih dahulu menjadi <em>Subtotal Pesanan</em>.
                  </li>
                  <li>
                    • <strong>Langkah 2:</strong> Komisi Platform (20%) dan Biaya Sukses Pemasaran / Booster (14%) dihitung dari <em>Subtotal Pesanan</em> tersebut.
                  </li>
                  <li>
                    • <strong>Keuntungan:</strong> Saat Anda memberi diskon, beban rupiah komisi platform ikut mengecil secara proporsional.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-900">
                    Skema GoFood (GoBiz / Maksimal PRO)
                  </span>
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-800 rounded border border-rose-200">
                    Subsidi Promo Bersama + Rp 800
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li>
                    • <strong>Langkah 1:</strong> Diskon konsumen dibagi antara <strong>Subsidi Gojek</strong> (misal 25%) dan <strong>Beban Mitra Usaha</strong> (misal 75%).
                  </li>
                  <li>
                    • <strong>Langkah 2:</strong> Biaya Layanan GoFood (20%) dihitung dari <em>(Harga Tayang dikurangi Beban Promo Mitra)</em> ditambah komponen tetap <strong>Rp 800</strong> per transaksi.
                  </li>
                  <li>
                    • <strong>Catatan Penting:</strong> Karena adanya subsidi Gojek, dasar pengenaan komisi 20% menjadi lebih tinggi dibanding jika dipotong dari harga bersih konsumen.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HARAPAN & MISI KAMI UNTUK UMKM KULINER */}
        <section id="harapan-umkm" className="py-12 sm:py-16 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-5 h-5 text-emerald-400" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
              Harapan & Misi Kami
            </span>

            <h2 className="text-xl sm:text-3xl font-bold tracking-tight leading-snug">
              Agar Setiap Porsi Makanan yang Keluar dari Dapur UMKM Benar-Benar Menghasilkan Berkah & Keuntungan yang Sehat
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Kami membangun <strong>FoodMerchant Pricing Engine</strong> dengan satu harapan sederhana: agar tidak ada lagi pemilik warung makan, kedai kopi, atau restoran keluarga yang terpaksa tutup karena salah menghitung potongan komisi dan diskon aplikasi. Kami berharap setiap pelaku UMKM kuliner di Indonesia memiliki kepastian angka layaknya jaringan restoran besar—sehingga bisa terus tumbuh, menggaji karyawan dengan layak, dan melayani pelanggan dengan tenang.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onEnterCalculator}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <span>Mulai Hitung Harga Menu Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!authUser && (
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors cursor-pointer"
                >
                  <span>Buat Akun Resto Gratis</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="font-medium text-slate-700">
            FoodMerchant Pricing & Margin Engine — Untuk UMKM Kuliner Indonesia
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenEducationModal}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Bedah Rumus Komisi
            </button>
            <button
              type="button"
              onClick={onEnterCalculator}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Kalkulator Harga
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

