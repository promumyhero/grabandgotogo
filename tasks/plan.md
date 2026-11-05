# Implementation Plan: Landing Page Edukatif & Redesain Responsif Modul Edukasi GrabFood vs GoFood

## Overview
Membangun **Landing Page** berstandar finansial/editorial modern (`src/components/LandingPage.tsx`) dengan alur **Smart Context-Aware UX** (pengunjung baru disambut Landing Page; pemilik resto yang sudah login langsung masuk ke Workspace Kalkulator mereka dengan akses 1-klik ke Beranda), serta merombak penuh `src/components/PricingEducationModal.tsx` menggunakan prinsip `/frontend-ui-engineering` agar rapi, proporsional, dan nyaman dioperasikan di layar **HP (`320px+`), Tablet (`768px+`), dan Laptop (`1024px+`)**.

## Task List

### Phase 1: Landing Page & Smart Context-Aware Navigation
- [x] **Task 1**: Bangun Komponen `src/components/LandingPage.tsx` (Hero + Simulasi Perbandingan Nyata Markup Biasa vs Pricing Engine, Tujuan & Masalah yang Diselesaikan, Harapan untuk UMKM Kuliner Indonesia, serta Navigasi ke Kalkulator/Login/Panduan)
- [x] **Task 2**: Integrasikan Alur *Smart Context-Aware UX* (`landing` <-> `calculator`) di `src/app/page.tsx` beserta tombol **"Beranda"** di Header Kalkulator

### Phase 2: Mobile-First Responsive Redesign pada `PricingEducationModal.tsx`
- [x] **Task 3**: Rombak `src/components/PricingEducationModal.tsx` dengan navigasi *Segmented Pill* 3-kolom ringkas, pemilih platform di layar HP, kartu alur struk visual (menggantikan blok kode yang memanjang), serta *Quick-Tap Preset Chips* pada Simulator

### Checkpoint: Verification
- [x] `pnpm exec tsc --noEmit` lulus (0 error)
- [x] `pnpm run lint` lulus (0 error, 0 warning)
- [x] `pnpm run build` lulus 100%
