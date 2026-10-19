# 🍱 FoodMerchant Pricing & Margin Engine

> **Aplikasi Kalkulator & Simulasi Penetapan Harga Menu Multi-Platform (GrabFood & GoFood) Anti-Bocor Margin untuk UMKM & Restoran.**

---

## 📌 Latar Belakang & Masalah
Banyak merchant UMKM di platform pesan antar makanan (*online food delivery*) seperti **GrabFood** dan **GoFood** mengalami kerugian terselubung akibat:
1. **Diskon Merchant**: Mengurangi harga tayang menu sebelum komisi platform dipotong.
2. **Komisi Platform**: Potongan bagi hasil platform (standar 20%).
3. **Marketing Booster / Iklan**: Potongan tambahan (contoh 14% di GrabFood) yang dihitung dari subtotal setelah diskon.
4. **Rounding / Pembulatan**: Pembulatan harga di sistem kasir dan aplikasi yang menyebabkan *variance* negatif jika tidak diperhitungkan.

**FoodMerchant Pricing Engine** hadir sebagai solusi komprehensif untuk menghitung secara presisi *net payout* bersih yang diterima merchant, serta memberikan **rekomendasi otomatis harga tayang (display price)** agar target harga offline (keuntungan pokok) merchant tidak pernah defisit.

---

## 🚀 Fitur Utama

### 1. Dual Engine Mode:
- **Mode A (Kalkulasi Maju / Forward Simulation):**
  - Menginput harga tayang yang direncanakan.
  - Menghitung diskon nominal/persentase, subtotal setelah diskon, komisi platform, marketing booster, hingga **Net Payout Bersih**.
  - Deteksi status margin: **Untung / Surplus**, **Impas (Break Even)**, atau **Rugi / Defisit**.
- **Mode B (Rekomendasi Balik / Reverse Engineering):**
  - Menginput target harga offline yang ingin diterima bersih di rekening merchant.
  - Menghitung harga tayang minimum mutlak secara matematis agar *net payout* $\ge$ *target offline*.
  - Dilengkapi aturan pembulatan cerdas (*Ceil Rp100, Ceil Rp500, Ceil Rp1.000*).

### 2. Simulator Struk Interaktif (Interactive Receipt Modal):
- Visualisasi struk bergaya GrabFood / GoFood Merchant.
- Memperlihatkan rincian per baris: Harga Tayang, Diskon Merchant, Subtotal Bayar Konsumen, Potongan Komisi Grab (20%), Potongan Booster Iklan (14%), hingga **Net Payout Bersih ke Rekening Merchant**.

### 3. Multi-Channel Workspace Switcher:
- Dukungan konfigurasi preset terpisah antara **GrabFood** (Komisi 20% + Booster 14% + Diskon default 30%) dan **GoFood** (Komisi 20%).
- Preset bar global untuk menerapkan persentase komisi, booster, diskon, dan aturan pembulatan ke seluruh menu sekaligus.

### 4. Ringkasan KPI Finansial Real-Time:
- **Estimasi Omzet Kotor (Gross Display)**
- **Estimasi Pencairan Bersih (Net Payout)**
- **Rata-rata Potongan Efektif (%)**
- **Indikator Menu Berisiko Rugi (Loss Items Alert)**

### 5. Ekspor Data & Penyimpanan Fleksibel:
- **LocalStorage First**: Aplikasi dapat langsung digunakan tanpa setup database rumit; data menu tersimpan otomatis di browser.
- **Prisma & PostgreSQL Sync**: Dukungan sinkronisasi database relasional skala produksi via tombol *Sync to DB*.
- **Ekspor CSV**: Unduh laporan seluruh daftar menu, formula, potongan, dan rekomendasi harga dengan 1 klik.

---

## 📐 Benchmark Matematis & Validasi Formula

Formula telah diuji dengan *unit test benchmark* (kode acuan transaksi nyata `GF-957`):
- **Harga Tayang:** Rp64.400
- **Diskon Merchant (30%):** Rp19.320
- **Subtotal Setelah Diskon:** Rp45.080
- **Komisi Platform (20%):** Rp9.016
- **Marketing Booster (14%):** Rp6.311
- **Net Payout:** Rp29.753 (Target Rp30.000 $\rightarrow$ *Defisit/Variance:* -Rp247)
- **Rekomendasi Balik:** Minimum Rp65.000 (Ceil 500) $\rightarrow$ *Net Payout:* Rp30.030 (*Surplus:* +Rp30).

### Benchmark GoFood / GoBiz (Order `F-3388856614`):
- **Penjualan Katalog:** Rp45.950
- **Biaya Layanan Delivery (20%):** Rp9.190 (atau Rp9.300 sesuai tier invoice)
- **Promo Konsumen (Nominal):** Rp4.600
- **Subsidi Gojek (25% Maksimal PRO):** Rp1.150
- **Biaya Ditanggung Mitra (75%):** Rp3.450
- **Pendapatan Bersih:** Rp33.310 (Target Rp28.000 $\rightarrow$ *Surplus:* +Rp5.310).

Uji validasi dapat dijalankan via:
```bash
node scripts/test-engine.mjs
```

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org) 16 (App Router)
- **Library UI:** [React](https://react.dev) 19 & [Lucide React](https://lucide.dev) Icons
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
- **Database & ORM:** [Prisma ORM](https://www.prisma.io) v7 with PostgreSQL (`@prisma/adapter-pg`)
- **Language:** TypeScript 5
- **Package Manager:** pnpm

---

## 📂 Struktur Proyek

```
grabdangotogo/
├── prisma/
│   └── schema.prisma            # Skema database (Merchant, Workspace, MenuItem, CalculationAudit, PaymentTransaction)
├── scripts/
│   └── test-engine.mjs          # Script pengujian logika pricing engine (GrabFood & GoFood)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── pricings/bulk-upsert/route.ts  # Endpoint bulk save menu ke database
│   │   │   └── webhooks/payment/route.ts      # Endpoint webhook transaksi QRIS
│   │   ├── globals.css          # Styling Tailwind v4
│   │   ├── layout.tsx           # Layout root
│   │   └── page.tsx             # Halaman utama kalkulator & dashboard
│   ├── components/
│   │   ├── AddMenuModal.tsx     # Modal tambah menu baru
│   │   ├── DashboardSkeleton.tsx# Skeleton loader zero-layout-shift
│   │   ├── GlobalPresetBar.tsx  # Bar pengaturan preset komisi & diskon massal
│   │   ├── GoFoodReceiptModal.tsx# Modal simulasi struk GoFood/GoBiz Order F-3388856614
│   │   ├── GrabReceiptModal.tsx # Modal simulasi struk transaksi GrabFood Order GF-957
│   │   ├── KpiSummaryCards.tsx  # Kartu ringkasan metrik finansial
│   │   ├── PricingTable.tsx     # Tabel interaktif kalkulasi & rekomendasi harga
│   │   └── WorkspaceSwitcher.tsx# Tab beralih GrabFood & GoFood
│   ├── lib/
│   │   ├── csv-helper.ts        # Helper ekspor data ke file CSV
│   │   ├── pricing-engine.ts    # Inti kalkulasi matematika Forward & Reverse
│   │   ├── prisma.ts            # Client singleton Prisma ORM
│   │   ├── storage.ts           # State persistence ke LocalStorage
│   │   └── utils.ts             # Format mata uang IDR & utility styling
│   └── types/
│       └── pricing.ts           # Definisi interface & tipe TypeScript
├── .env.example                 # Contoh variabel konfigurasi environment
├── package.json
└── tsconfig.json
```

---

## 💻 Panduan Instalasi & Menjalankan

### 1. Kloning Repositori
```bash
git clone https://github.com/promumyhero/grabandgotogo.git
cd grabandgotogo
```

### 2. Instalasi Dependensi
```bash
pnpm install
# atau npm install / yarn install
```

### 3. Setup Lingkungan (.env)
Salin `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi `DATABASE_URL` jika ingin mengaktifkan sinkronisasi PostgreSQL.

### 4. Generate Prisma Client (Opsional jika menggunakan DB)
```bash
pnpm prisma generate
```

### 5. Jalankan Development Server
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📄 Lisensi
Proyek ini dibuat untuk membantu ekosistem UMKM merchant makanan di Indonesia. Dilisensikan di bawah [MIT License](LICENSE).
