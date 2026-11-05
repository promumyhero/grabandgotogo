# Spec: Landing Page Edukatif & Redesain Responsif Modul Edukasi GrabFood vs GoFood (Mobile, Tablet & Desktop)

## Assumptions
1. **Alur Kunjungan Awal (Landing First vs Logged-In Fast Track)**:
   - Pengunjung yang **belum login** saat membuka `/` akan disambut oleh **Landing Page** terlebih dahulu yang menjelaskan tujuan, masalah yang diselesaikan, harapan bagi UMKM kuliner, serta bedah singkat perhitungan GrabFood vs GoFood.
   - Pengunjung dapat menekan tombol **"Coba Kalkulator (Mode Demo)"** atau **"Masuk / Daftar Akun Resto"** untuk masuk ke workspace kalkulator, serta dapat kembali ke Landing Page kapan saja lewat tombol **"Beranda"** di header kalkulator.
   - Pengguna yang **sudah login** memiliki akses instan ke workspace kalkulator mereka, namun tetap dapat membuka tampilan Landing Page jika mengklik logo/tombol **"Tentang & Beranda"**.
2. **Desain Mobile-First (`320px` HP, `768px` Tablet, `1024px+` Laptop)**:
   - Seluruh tata letak Landing Page dan Modul Edukasi dirancang mulai dari layar HP (`360px`) dengan target sentuh minimal `44x44px`, tanpa *horizontal overflow*, dan tanpa blok rumus bergaya kode pemrograman (`font-mono` panjang) yang terpotong di layar sempit.
3. **Anti-AI Slop & Editorial B2B Aesthetic**:
   - Menggunakan palet warna finansial yang bersih (`slate-950`, `slate-50`, aksen semantik `emerald-600` untuk GrabFood/Margin Aman dan `rose-600` untuk GoFood/Defisit), tipografi terstruktur (`h1` -> `h2` -> `h3`), tanpa gradasi ungu/pelangi atau kartu generik.

---

## Objective
1. **Membangun Landing Page Profesional & Bermakna**:
   Menjelaskan secara jernih kepada pemilik warung, restoran, dan UMKM kuliner Indonesia:
   - **Apa fungsi web ini**: Kalkulator *reverse-engineering* harga jual online & simulator potongan komisi nyata untuk **GrabFood** dan **GoFood / GoBiz**.
   - **Mengapa web ini dibuat**: Banyak pelaku usaha kuliner mengalami *boncos* tersembunyi karena menaikkan harga dengan persentase biasa, tanpa menyadari perbedaan dasar pemotongan komisi GrabFood (*Net-Base*) vs GoFood (*Co-Funded Subsidy + Biaya Layanan Rp 800*).
   - **Harapan & Misi**: Membantu UMKM kuliner tetap kompetitif mengikuti kampanye diskon aplikasi pesan-antar **tanpa mengorbankan margin bersih dapur sepeser pun**.
2. **Merombak UI/UX Modul Edukasi GrabFood vs GoFood (`PricingEducationModal` & Seksi Edukasi)**:
   Memperbaiki tata letak yang sebelumnya padat dan kurang rapi di layar HP/Tablet menjadi tampilan visual bertahap (*step-by-step card flow*), navigasi *segmented control* yang ringkas di HP, serta simulator interaktif dengan tombol angka cepat (*quick-tap chips*) yang nyaman digunakan di ponsel maupun tablet.

---

## Tech Stack
- **Framework**: Next.js `16.4.2` (App Router, Turbopack, `cacheComponents: true`)
- **UI & Styling**: React `19.3.0`, Tailwind CSS `v4` (Mobile-First Responsive Breakpoints: default/`sm`/`md`/`lg`), `lucide-react` `^1.59.0`
- **Accessibility**: WCAG 2.1 AA (`role="dialog"`, `role="tablist"`, `role="tab"`, `aria-selected`, keyboard navigation, rasio kontras $\ge 4.5:1$)

---

## Commands
```bash
# Development server
pnpm run dev

# Type checking
pnpm exec tsc --noEmit

# Linting
pnpm run lint

# Production build
pnpm run build
```

---

## Project Structure
```text
src/
├── app/
│   └── page.tsx                         → Orkestrasi tampilan Landing Page vs Workspace Kalkulator
├── components/
│   ├── LandingPage.tsx                  → [BARU] Komponen Landing Page (Hero, Masalah vs Solusi, Harapan UMKM, Preview Rumus, CTA)
│   ├── PricingEducationModal.tsx        → [REFAKTOR PENUH] Modal & Konten Edukasi Responsif (HP, Tablet, Laptop)
│   └── AuthModal.tsx                    → Modal Login & Registrasi Akun Resto
```

---

## Code Style & Responsive Design Contract
Mengikuti panduan `/frontend-ui-engineering`:
- **Hindari blok teks rumus memanjang yang merusak layar HP**; gunakan kartu alur vertikal dengan pemisah langkah bernomor dan perbandingan angka nyata.
- **Navigasi Tab Ringkas di HP**: Menggunakan `grid-cols-3` dengan label pendek yang jelas (`Perbandingan`, `Bedah Rumus`, `Simulator`) sehingga tidak pernah terpotong di layar `320px–375px`.

```tsx
// Contoh Struktur Kartu Langkah Rumus yang Responsif (HP -> Tablet -> Laptop)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
  <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <header className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
      <h3 className="text-sm sm:text-base font-bold text-slate-900">GrabFood</h3>
      <span className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
        Potong dari Harga Setelah Diskon
      </span>
    </header>
    {/* Alur vertikal langkah demi langkah yang rapi di layar 320px */}
  </section>
</div>
```

---

## Testing Strategy
1. **Responsive Breakpoint Verification**:
   - **Mobile (`320px – 480px`)**: Navigasi tab, kartu langkah rumus, dan simulator harus tampil 1 kolom penuh tanpa *horizontal scroll*, teks tidak bertabrakan, dan memiliki *quick-select chips* agar mudah diuji dengan satu jari.
   - **Tablet (`768px – 1024px`)**: Kartu perbandingan dan KPI tersusun proporsional dalam grid 2 kolom dengan ruang baca yang lega.
   - **Desktop (`1280px – 1440px`)**: Tata letak *split-view* pada Hero Landing Page dan perbandingan berdampingan GrabFood vs GoFood.
2. **Static & Build Verification**:
   - `pnpm exec tsc --noEmit`, `pnpm run lint`, dan `pnpm run build` menghasilkan **0 error, 0 warning**.

---

## Boundaries
- **Always do:**
  - Gunakan prinsip *mobile-first* (`p-4 sm:p-6`, `text-sm sm:text-base`, `grid-cols-1 md:grid-cols-2`).
  - Sediakan cara instan untuk berpindah antara **Landing Page** dan **Kalkulator Workspace** tanpa kehilangan data simulasi.
  - Pastikan semua elemen interaktif dapat diakses dengan keyboard (`Tab`, `Enter`, `Escape`).
- **Ask first:**
  - Mengubah rumus perhitungan inti di `src/lib/pricing-engine.ts`.
  - Menambahkan library animasi eksternal yang memperbesar ukuran bundle.
- **Never do:**
  - Menggunakan *AI Slop* (gradasi ungu/indigo, *lorem ipsum*, bayangan berlapis berlebihan, atau kalimat promosi klise).
  - Menampilkan tabel/blok kode lebar di layar HP yang memaksa pengguna menggeser layar ke kanan-kiri.

---

## Success Criteria
1. **Landing Page Hadir sebagai Gerbang Utama yang Jelas**:
   - Menjelaskan **Apa Itu FoodMerchant Pricing Engine**, **Masalah Boncos Tersembunyi di GrabFood & GoFood**, **Harapan & Misi untuk UMKM Kuliner**, serta **Contoh Perbandingan Nyata** sebelum pengguna masuk ke kalkulator.
   - Memiliki tombol CTA jelas: **"Buka Kalkulator (Mode Demo)"**, **"Daftar / Masuk Akun Resto"**, dan **"Pelajari Cara Hitung Platform"**.
2. **Halaman/Modal Edukasi GrabFood vs GoFood Rapi di HP, Tablet, dan Laptop**:
   - Pada layar HP (`< 640px`), disediakan pemilih platform cepat atau kartu bertumpuk yang bersih, langkah perhitungan disajikan sebagai **Alur Struk Visual** (bukan rumus kode mentah), dan Simulator memiliki tombol *preset* nominal cepat (`Rp 20rb`, `Rp 28rb`, `Rp 35rb`, `Rp 50rb`) sehingga sangat nyaman dipakai di layar sentuh.
3. Lulus verifikasi `pnpm exec tsc --noEmit`, `pnpm run lint`, dan `pnpm run build` dengan **0 error & 0 warning**.

---

## Open Questions
1. **Perilaku Kunjungan Pengguna yang Sudah Login**: Saat pemilik resto yang **sudah login** membuka web, apakah Anda ingin mereka langsung masuk ke **Kalkulator Workspace** (dengan tombol *"Beranda / Tentang"* di header jika ingin melihat Landing Page), atau tetap melihat **Landing Page** terlebih dahulu?
2. **Isi Pesan "Harapan Kami" di Landing Page**: Apakah Anda memiliki nama brand/inisiatif khusus atau kutipan pesan harapan tertentu untuk UMKM kuliner yang ingin ditampilkan di bagian misi Landing Page?
