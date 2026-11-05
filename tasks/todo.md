# Task Breakdown & Checklist: Landing Page & Responsive Education UI

## Task 1: Bangun Komponen `LandingPage.tsx`

**Description:** Membuat halaman sambutan (`src/components/LandingPage.tsx`) yang menjelaskan fungsi aplikasi, masalah _boncos_ akibat markup biasa di GrabFood & GoFood, harapan untuk UMKM kuliner Indonesia, serta kartu perbandingan interaktif nyata.

**Acceptance criteria:**

- [x] Menampilkan Hero Section dengan CTA jelas (_Buka Kalkulator_, _Daftar/Masuk Akun Resto_, _Pelajari Rumus_).
- [x] Menampilkan perbandingan nyata _Cara Lama (Markup Biasa -> Boncos)_ vs _Pricing Engine (Harga Tayang Aman -> Margin Utuh)_.
- [x] Menampilkan seksi **Harapan & Misi untuk UMKM Kuliner Indonesia**.
- [x] Responsif penuh di HP, Tablet, dan Laptop tanpa _AI Slop_.

**Verification:**

- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`

---

## Task 2: Rombak `PricingEducationModal.tsx` (Mobile, Tablet & Desktop)

**Description:** Merancang ulang modal edukasi GrabFood vs GoFood agar nyaman dibaca di layar HP (`320px–640px`), Tablet (`768px`), dan Laptop (`1024px+`) dengan _Segmented Control_ 3-tab ringkas, filter platform di layar HP, alur visual bernomor, dan _Quick-Tap Chips_ pada simulator.

**Acceptance criteria:**

- [x] Tidak ada _horizontal overflow_ atau teks rumus yang terpotong di layar HP `320px`.
- [x] Tab 1 memiliki filter platform cepat di layar HP (`GrabFood`, `GoFood`, `Semua`) dan tampil berdampingan di Tablet/Laptop.
- [x] Tab 3 (Simulator) menyediakan tombol angka cepat (_Quick-Tap Chips_) untuk Harga Offline dan Diskon.

**Verification:**

- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`

---

## Task 3: Integrasikan Alur _Smart Context-Aware UX_ di `src/app/page.tsx`

**Description:** Menghubungkan `LandingPage.tsx` dengan `src/app/page.tsx` sehingga pengunjung baru melihat Landing Page terlebih dahulu, sedangkan pemilik resto yang sudah login langsung masuk ke Kalkulator Workspace dengan tombol **"Beranda"** di header untuk membuka kembali Landing Page kapan saja.

**Acceptance criteria:**

- [x] Pengunjung belum login melihat `LandingPage` saat membuka `/` dan dapat masuk ke Kalkulator dengan 1 klik.
- [x] Pengguna yang sudah login langsung masuk ke Kalkulator Workspace dan dapat beralih ke `LandingPage` lewat tombol **Beranda** di header.

**Verification:**

- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint` && `pnpm run build`
