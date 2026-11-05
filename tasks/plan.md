# Implementation Plan: Hardened Merchant Authentication (Supabase PostgreSQL Ready), Demo Gate, Per-Resto Discount Templates & Pricing Education

## Overview
Membangun sistem autentikasi multi-tenant berstandar keamanan tinggi (OWASP Top 10, `crypto.scrypt` + `timingSafeEqual`, cookie sesi `HttpOnly` bertanda tangan HMAC-SHA256, dan Next.js 16 `src/proxy.ts`) yang siap terhubung langsung ke **Supabase PostgreSQL** (`DATABASE_URL` / `DIRECT_URL`), dilengkapi dengan **Mode Demo Terbatas (Guest Mode)** untuk pengunjung yang belum login, fitur **Template Skema Promo Resto Kustom**, **Kalkulator HPP (Modal Bahan Baku & Kemasan)** opsional untuk mencari *Target Harga Offline*, serta modul edukasi interaktif **"Panduan & Bedah Rumus GrabFood vs GoFood"**.

## Dependency Graph

```
Database Schema (Supabase PostgreSQL + Prisma: Merchant, MerchantSession, Workspace, MenuItem, DiscountTemplate)
    │
    ├── Security Core & Dead Code Cleanup (`src/lib/security.ts`, `src/lib/auth.ts`, `src/lib/pricing-engine.ts`)
    │       │
    │       ├── Next.js 16 Proxy (`src/proxy.ts`) + Security Headers (CSP, HSTS, X-Frame-Options, CSRF Origin Check)
    │       │       │
    │       │       └── Auth API Endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)
    │       │               │
    │       │               └── Auth UI (`AuthModal.tsx`), Demo Mode Feature Gate & Header Merchant Profile
    │       │
    │       └── Tenant-Scoped Pricing & Discount API (`/api/pricings/workspace`, `/api/pricings/bulk-upsert`)
    │               │
    │               └── Tenant-Namespaced Storage & Custom Resto Discount Templates (`GlobalPresetBar.tsx`)
    │
    └── Educational Pricing Engine Breakdown (`PricingEducationModal.tsx`)
```

## Architecture Decisions
1. **Supabase PostgreSQL Ready + Connection Pooling Compatibility**:
   - Skema Prisma dan adapter `@prisma/adapter-pg` dikonfigurasi agar kompatibel penuh dengan **Supabase PostgreSQL** (mendukung Transaction Pooler port `6543` dengan `?pgbouncer=true` maupun Direct Connection port `5432`), sambil tetap memiliki *graceful fallback* terenkripsi saat diuji secara offline tanpa koneksi DB.
2. **Mode Demo Terbatas vs Akun Resto Terautentikasi (Feature Gating)**:
   - **Mode Demo (Belum Login)**: Pengunjung dapat mencoba simulasi kalkulator pada daftar menu contoh (maksimal 5 menu), melihat simulasi struk, dan membuka **Panduan & Bedah Rumus**. Namun, fitur-fitur lanjutan dikunci (*Locked for Demo* dengan pemicu login 1-klik):
     - Menyimpan & membuat **Template Skema Promo Resto** kustom
     - **Import / Export CSV** & **Simpan ke Cloud Database (Supabase)**
     - **Bulk Action** (Ubah komisi/diskon/kategori massal) & **Kelola Kategori**
     - Menambah lebih dari **5 menu**
   - **Mode Akun Resto (Sudah Login)**: Seluruh fitur terbuka penuh, data tersimpan terisolasi per `merchantId` baik di Supabase PostgreSQL maupun cache browser lokal.
3. **Hardened Security (Anti-Injection, Anti-IDOR, Anti-Brute-Force)**:
   - **Password Hashing**: `crypto.scrypt` (memory-hard, 16-byte random salt, 64-byte key) + `crypto.timingSafeEqual` + *dummy hash verification* saat email tidak ditemukan untuk mencegah *user enumeration* via *timing attack*.
   - **Session Cookie**: `HttpOnly`, `SameSite=Lax`, `Secure` (di production), `Path=/`, ditandatangani dengan HMAC-SHA256 (`AUTH_SECRET`). Tidak ada token auth yang disimpan di `localStorage` (kebal pencurian token via XSS).
   - **Anti-IDOR**: Seluruh endpoint (`/api/pricings/workspace`, `/api/pricings/bulk-upsert`) wajib membaca `merchantId` dari cookie sesi server terverifikasi, bukan dari payload client, dan memfilter kepemilikan `where: { workspace: { merchantId: session.merchantId } }`.
4. **Template Skema Promo Resto (Custom Restaurant Discount Presets)**:
   - Setiap restoran dapat membuat dan menyimpan daftar skema promo andalan mereka (misal: *"Reguler Tanpa Promo"*, *"Promo Gajian 30% + Booster"*, *"GoFood Maksimal PRO Subsidi 25%"*, *"Flash Sale Potongan Rp 10.000"*) dan menerapkannya ke seluruh workspace atau menu terpilih dalam 1 klik.
5. **Pembersihan Dead Code + Bedah Rumus GrabFood vs GoFood**:
   - Menghapus *dead code* fungsi struk lama (`generateGrabReceipt`, `generateGoFoodReceipt`, `ReceiptLineItem`, `GrabReceiptData`, `GoFoodReceiptData`) agar codebase ramping, lalu membangun modal edukasi interaktif **`PricingEducationModal.tsx`**.

## Task List

### Phase 1: Foundation, Dead Code Cleanup & Hardened Auth Core
- [x] **Task 1**: Bersihkan Dead Code Struk Lama & Perbarui Skema Prisma (Supabase Ready) serta Tipe Data (`prisma/schema.prisma`, `src/types/pricing.ts`, `src/lib/pricing-engine.ts`)
- [x] **Task 2**: Bangun Core Keamanan: `scrypt` Password Hasher, Signed `HttpOnly` Session Manager, Rate Limiter, dan Input Validator (`src/lib/security.ts`, `src/lib/auth.ts`)
- [x] **Task 3**: Implementasikan Endpoint Autentikasi (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`) dan `src/proxy.ts` + Security Headers

### Checkpoint: Foundation & Auth Security
- [x] `pnpm exec tsc --noEmit` & `pnpm run lint` lulus dengan 0 error/warning
- [x] Alur registrasi, login, logout, rate-limiting, dan cookie `HttpOnly` berjalan aman

### Phase 2: Tenant-Isolated Workspaces, Demo Gate & Custom Resto Discount Templates
- [x] **Task 4**: Perketat Endpoint Workspace & Bulk-Upsert dengan Isolasi Tenant Anti-IDOR untuk Supabase PostgreSQL (`/api/pricings/workspace`, `/api/pricings/bulk-upsert`)
- [x] **Task 5**: Isolasi Storage Per-User & Fitur Template Skema Promo Resto Kustom (`src/lib/storage.ts`, `src/components/GlobalPresetBar.tsx`)
- [x] **Task 6**: Bangun UI Autentikasi (`AuthModal.tsx`), Pembatas Fitur Mode Demo (*Demo Feature Gate*), dan Profil Resto di Header (`src/app/page.tsx`)

### Checkpoint: Multi-Tenant, Demo Gate & Discount Templates
- [x] Mode Demo membatasi fitur lanjutan dengan rapi dan mengarahkan ke modal Login/Daftar
- [x] Akun Resto yang login memiliki workspace, menu, dan Template Skema Promo yang terisolasi penuh

### Phase 3: Educational Calculation Guide ("Bedah Rumus GrabFood vs GoFood") + HPP Helper
- [x] **Task 7**: Bangun Komponen Panduan & Bedah Rumus Interaktif (`src/components/PricingEducationModal.tsx`) beserta Kalkulator Bantu HPP -> Target Offline di Modal Menu

### Checkpoint: Complete
- [x] Semua *acceptance criteria* terpenuhi
- [x] `pnpm exec tsc --noEmit` dan `pnpm run lint` bersih (0 error, 0 warning)
