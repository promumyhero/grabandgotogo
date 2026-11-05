# Task Breakdown & Checklist: Hardened Auth (Supabase Ready), Demo Gate, Resto Discount Templates & Pricing Guide

## Task 1: Bersihkan Dead Code Struk Lama & Perbarui Skema Prisma (Supabase Ready) serta Tipe Data

**Description:** Menghapus *dead code* fungsi dan tipe struk lama (`generateGrabReceipt`, `generateGoFoodReceipt`, `ReceiptLineItem`, `GrabReceiptData`, `GoFoodReceiptData`) dari `src/lib/pricing-engine.ts` dan `src/types/pricing.ts`. Memperbarui `prisma/schema.prisma` agar siap digunakan dengan **Supabase PostgreSQL**, menambahkan field autentikasi pada `Merchant` (`email` unik, `passwordHash`), model `MerchantSession`, serta dukungan parameter GoFood (`gojekSubsidyPct`, `isCoFundedPromo`) dan `DiscountTemplate` pada `Workspace`.

**Acceptance criteria:**
- [x] Fungsi `generateGrabReceipt` & `generateGoFoodReceipt` serta tipe `ReceiptLineItem`, `GrabReceiptData`, `GoFoodReceiptData` dihapus bersih tanpa memutus impor apa pun.
- [x] `prisma/schema.prisma` mendukung model `Merchant` dengan `passwordHash`, `MerchantSession`, serta `DiscountTemplate` per-resto.
- [x] Tipe `AuthUser`, `DiscountTemplate`, dan `AuthSession` terdefinisi di `src/types/pricing.ts`.

**Verification:**
- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`
- [x] Manual check: Pastikan tidak ada referensi tersisa ke fungsi dead code yang dihapus.

**Dependencies:** None

**Files likely touched:**
- `prisma/schema.prisma`
- `src/types/pricing.ts`
- `src/lib/pricing-engine.ts`

**Estimated scope:** Medium (3 files)

---

## Task 2: Bangun Core Keamanan: `scrypt` Password Hasher, Signed `HttpOnly` Session Manager, Rate Limiter, dan Input Validator

**Description:** Membangun modul keamanan di `src/lib/security.ts` dan `src/lib/auth.ts` (`server-only`). Mencakup hashing password `crypto.scrypt` dengan salt acak 16-byte + `crypto.timingSafeEqual`, manajemen cookie sesi `HttpOnly` bertanda tangan HMAC-SHA256, *sliding-window rate limiter* untuk mencegah serangan brute-force, serta sanitasi/validasi skema ketat untuk mencegah SQL/NoSQL/XSS injection.

**Acceptance criteria:**
- [x] `hashPassword` dan `verifyPassword` menggunakan `crypto.scrypt` + `crypto.timingSafeEqual`, ditambah `verifyDummyPassword` agar waktu respons saat email tidak terdaftar tetap identik (*anti-timing enumeration*).
- [x] Sesi disimpan dalam cookie `HttpOnly`, `SameSite=Lax`, `Secure` (di production), `Path=/` dengan tanda tangan HMAC-SHA256 yang tahan manipulasi (*tamper-proof*).
- [x] Validator menolak input berbahaya (karakter kontrol, tag HTML/script pada nama resto/email, atau angka di luar batas wajar).

**Verification:**
- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`
- [x] Manual check: Verifikasi tanda tangan token sesi dan fungsi rate limiter.

**Dependencies:** Task 1

**Files likely touched:**
- `src/lib/security.ts`
- `src/lib/auth.ts`

**Estimated scope:** Small (2 files)

---

## Task 3: Implementasikan Endpoint Autentikasi (`/api/auth/*`) dan Proteksi `src/proxy.ts` + Security Headers

**Description:** Membuat endpoint `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, dan `/api/auth/me` yang terintegrasi dengan Prisma (Supabase PostgreSQL) sekaligus memiliki fallback aman jika DB belum dihubungkan. Menambahkan `src/proxy.ts` (konvensi Next.js 16 pengganti `middleware.ts`) untuk menyuntikkan HTTP Security Headers (`CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) dan validasi `Origin` anti-CSRF pada seluruh request mutasi API.

**Acceptance criteria:**
- [x] Registrasi dan login memvalidasi email, kekuatan password (minimal 8 karakter, huruf + angka), dan nama resto, serta menerapkan rate-limiting per IP + email.
- [x] Response API tidak pernah membocorkan `passwordHash` atau stack trace internal di production.
- [x] `src/proxy.ts` menambahkan security headers dan menolak mutasi `POST`/`PUT`/`DELETE` ke `/api/auth/*` atau `/api/pricings/*` jika header `Origin` tidak sesuai dengan host aplikasi.

**Verification:**
- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`
- [x] Manual check: Periksa header keamanan dan alur cookie sesi pada endpoint `/api/auth/*`.

**Dependencies:** Task 2

**Files likely touched:**
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/proxy.ts`

**Estimated scope:** Medium (5 files)

---

## Checkpoint: After Tasks 1-3 (Foundation, Cleanup & Auth Security)
- [x] `pnpm exec tsc --noEmit` dan `pnpm run lint` lulus (0 error, 0 warning)
- [x] Dead code telah bersih dan endpoint autentikasi terlindungi penuh

---

## Task 4: Perketat Endpoint Workspace & Bulk-Upsert dengan Isolasi Tenant Anti-IDOR untuk Supabase

**Description:** Memperbarui `POST /api/pricings/bulk-upsert` dan membuat `GET /api/pricings/workspace` agar wajib memverifikasi sesi pengguna (`getSessionUser()`). Menolak panggilan tanpa sesi valid (`401 Unauthorized` — karena fitur Cloud Sync hanya untuk pengguna terdaftar, bukan Mode Demo), serta mengikat seluruh query dan upsert `Workspace` dan `MenuItem` ke `session.merchantId` untuk menutup celah IDOR.

**Acceptance criteria:**
- [x] `POST /api/pricings/bulk-upsert` dan `GET /api/pricings/workspace` menolak request tanpa sesi autentikasi valid dengan status `401`.
- [x] `merchantId` selalu diambil dari sesi server terverifikasi (mengabaikan `merchantId` dari body request).
- [x] ID item menu di-scope ke workspace milik merchant yang login sehingga tidak mungkin menimpa data merchant lain di Supabase.

**Verification:**
- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`
- [x] Manual check: Pastikan unauthenticated request ke `/api/pricings/bulk-upsert` ditolak dengan `401`.

**Dependencies:** Task 3

**Files likely touched:**
- `src/app/api/pricings/bulk-upsert/route.ts`
- `src/app/api/pricings/workspace/route.ts`

**Estimated scope:** Small (2 files)

---

## Task 5: Isolasi Storage Per-User & Fitur Template Skema Promo Resto Kustom

**Description:** Memperbarui `src/lib/storage.ts` agar kunci `localStorage` dipisahkan berdasarkan `merchantId` (`demo` untuk Mode Demo, dan `merchant_${id}` untuk akun terdaftar), serta menambahkan manajemen **Template Skema Promo Resto** di `src/components/GlobalPresetBar.tsx`. Pemilik resto yang login dapat menyimpan skema diskon/komisi/subsidi mereka (misal: *"Promo Gajian 30%"*, *"GoFood Maksimal PRO 25%"*, *"Harga Normal Tanpa Promo"*) dan menerapkannya ke menu resto mereka dalam 1 klik.

**Acceptance criteria:**
- [x] Data di `localStorage` terisolasi per `merchantId` sehingga berganti akun tidak mencampur menu atau preset diskon.
- [x] `GlobalPresetBar.tsx` menampilkan pemilih & pembuat **Template Skema Promo Resto** (terkunci dengan badge *"Fitur Akun Resto"* saat dalam Mode Demo, dan aktif penuh saat sudah login).
- [x] Pengguna yang login dapat menyimpan skema baru, memilih skema untuk diterapkan ke workspace/menu, dan menghapus skema kustom.

**Verification:**
- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`
- [x] Manual check: Uji penyimpanan dan penerapan Template Skema Promo pada akun resto.

**Dependencies:** Task 4

**Files likely touched:**
- `src/lib/storage.ts`
- `src/components/GlobalPresetBar.tsx`

**Estimated scope:** Small (2 files)

---

## Task 6: Bangun UI Autentikasi (`AuthModal.tsx`), Pembatas Fitur Mode Demo, dan Profil Resto di Header

**Description:** Membuat `src/components/AuthModal.tsx` (Tab Masuk & Daftar Resto Baru, indikator kekuatan password, opsi migrasi simulasi demo ke akun baru) dan mengintegrasikan **Mode Demo Terbatas vs Akun Resto** di `src/app/page.tsx`. Dalam Mode Demo, pengguna melihat banner/badge status *"Mode Demo (Terbatas Maks. 5 Menu)"* dan saat mengklik fitur terkunci (Simpan Cloud/Database, Import/Export CSV, Kelola Kategori, Template Promo Kustom, atau tambah menu ke-6), aplikasi menampilkan prompt ramah untuk Masuk/Daftar.

**Acceptance criteria:**
- [x] `AuthModal.tsx` memenuhi standar WCAG 2.1 AA, minimalis modern, dan bebas *AI Slop*.
- [x] Mode Demo membatasi penambahan menu maksimal 5 item dan mengunci fitur Cloud Sync, CSV Import/Export, Kelola Kategori, serta Simpan Template Promo dengan mengarahkan pengguna ke `AuthModal`.
- [x] Saat login berhasil, seluruh pembatas terbuka, nama restoran tampil di header, dan data workspace dimuat sesuai akun tersebut.

**Verification:**
- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`
- [x] Manual check: Uji alur Mode Demo (coba klik fitur terkunci -> muncul modal login) dan alur setelah Login.

**Dependencies:** Task 3, Task 5

**Files likely touched:**
- `src/components/AuthModal.tsx`
- `src/app/page.tsx`

**Estimated scope:** Small (2 files)

---

## Checkpoint: After Tasks 4-6 (Multi-Tenant, Demo Gate & Custom Promo Templates)
- [x] Pembatas Mode Demo vs Akun Resto bekerja sesuai spesifikasi
- [x] Isolasi tenant dan Template Skema Promo berfungsi penuh

---

## Task 7: Bangun Komponen Panduan & Bedah Rumus Interaktif (`PricingEducationModal.tsx`) + Kalkulator Bantu HPP

**Description:** Membangun `src/components/PricingEducationModal.tsx` yang membedah secara visual dan matematis cara perhitungan **GrabFood vs GoFood** (mengapa komisi dari harga kotor di GoFood + pembagian subsidi Co-Funding sering membuat merchant boncos tanpa sadar, serta cara kerja rumus *Reverse-Engineering* Harga Tayang Aman), dilengkapi **Simulator Perbandingan Langsung (Side-by-Side)** di dalam modal. Menambahkan juga pembantu hitung cepat **HPP (Modal Bahan Baku + Kemasan + Target Margin %)** di `AddMenuModal.tsx` & `EditMenuModal.tsx` untuk membantu merchant menentukan *Target Harga Offline*.

**Acceptance criteria:**
- [x] `PricingEducationModal.tsx` menyajikan 3 tab/bagian jelas:
  1. **Bedah Skema GrabFood vs GoFood** (diagram alur potongan komisi *Net-Base* vs *Gross-Base* & subsidi promo).
  2. **Rumus Anti-Boncos (Reverse Markup)** beserta efek pembulatan psikologis (`CEIL_100`, `CEIL_500`, `CEIL_1000`).
  3. **Simulator Perbandingan Side-by-Side** (1 input harga offline & diskon langsung menampilkan perbandingan hasil akhir GrabFood vs GoFood).
- [x] `AddMenuModal.tsx` dan `EditMenuModal.tsx` memiliki kalkulator bantu opsional *"Hitung dari HPP / Modal"* yang otomatis mengisi kolom `Target Harga Offline`.
- [x] Seluruh aplikasi lulus `pnpm exec tsc --noEmit` dan `pnpm run lint` dengan 0 error & 0 warning.

**Verification:**
- [x] Tests pass: `pnpm exec tsc --noEmit`
- [x] Build succeeds: `pnpm run lint`
- [x] Manual check: Verifikasi akurasi perhitungan di `PricingEducationModal.tsx` dan asisten HPP di modal menu.

**Dependencies:** Task 6

**Files likely touched:**
- `src/components/PricingEducationModal.tsx`
- `src/components/AddMenuModal.tsx`
- `src/components/EditMenuModal.tsx`
- `src/app/page.tsx`

**Estimated scope:** Medium (4 files)
