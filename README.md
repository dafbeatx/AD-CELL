# Aldea POS - Modern Mobile-First Cashier App

Aplikasi kasir & pembukuan operasional modern dengan filosofi **Anti-Slop UI/UX**, dirancang khusus untuk kecepatan input kasir satu jempol (*single-thumb mobile ergonomics*), kontras tinggi, angka tabular, serta arsitektur **Local-First (Offline PWA) + Supabase + GitHub + Vercel**.

---

## 🚀 Fitur Utama

1. **Dashboard Cepat:**
   - Ringkasan omset & estimasi laba hari ini
   - Total piutang kasbon belum lunas
   - Akses cepat ke 3 kategori produk, 6 channel transaksi finansial, pengeluaran, dan kasbon
   - Tombol utama Totalkan / Closing harian

2. **Transaksi Keuangan Multi-Channel (Bank, Dana, OVO, BCA):**
   - Perhitungan otomatis Saldo Berjalan, Omset, dan Selisih dengan Saldo Fisik (Aldea)
   - Tabel transaksi dengan auto-kalkulasi biaya admin berdasarkan rentang tarif resmi Aldea
   - Keypad numerik layar sentuh responsif dengan tombol cepat (+5k, +10k, +50k, +100k)

3. **Manajemen Produk & Stok (Acc, ATK, Voucher & SP):**
   - Tab "Daftar Produk" dan "Laporan Terjual"
   - Pencatatan stok awal, penambahan stok, sisa stok, unit terjual, modal, dan harga jual
   - Penjualan instan 1 unit per ketukan

4. **Buku Kasbon Mandiri:**
   - Tab "Belum Lunas" dan "Sudah Lunas"
   - Pencatatan nama pelanggan, nominal rupiah, tanggal, dan catatan
   - Tombol satu ketuk "Tandai Lunas"

5. **Pengeluaran Toko:**
   - Kategori Admin Toko vs Operasional
   - Otomatis mengurangi Laba Bersih pada sesi Closing

6. **Closing Kasir / Tutup Buku Harian:**
   - Rekap Omset, Laba Kotor, Pengeluaran Admin, dan Laba Bersih
   - Simpan snapshot harian ke riwayat dan reset baris transaksi untuk persiapan hari baru

7. **Local-First & Offline Resilience:**
   - Menggunakan **IndexedDB (Dexie.js)** sehingga aplikasi tetap berfungsi 100% normal tanpa koneksi internet
   - Fitur ekspor dan impor cadangan file JSON langsung dari perangkat

---

## 💻 Cara Menjalankan di Lokal (PC / Laptop)

```bash
# 1. Jalankan development server
npm run dev
```

Buka browser di `http://localhost:5173`.
Tekan **F12** > aktifkan **Toggle Device Toolbar** (pilih ukuran HP seperti Samsung Galaxy atau iPhone) untuk simulasi mobile app.

---

## ☁️ Menghubungkan ke Supabase (Database Cloud)

1. Buka dashboard proyek [Supabase](https://supabase.com).
2. Masuk ke **SQL Editor** lalu salin dan jalankan seluruh isi file `supabase/schema.sql`.
3. Buat file `.env.local` di folder utama aplikasi ini:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJh......
   ```

---

## 🌐 Deploy ke GitHub & Vercel

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "feat: inisialisasi Aldea POS modern mobile web app"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```

2. **Deploy di Vercel:**
   - Buka [Vercel](https://vercel.com) > **Add New Project**.
   - Pilih repositori GitHub Anda.
   - Vercel akan secara otomatis mendeteksi konfigurasi **Vite**.
   - Tambahkan Environment Variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
   - Klik **Deploy**.
