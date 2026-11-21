-- ==============================================================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL) UNTUK ALDEA POS
-- ==============================================================================
-- Jalankan skrip ini langsung di "SQL Editor" pada dashboard project Supabase Anda.

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. TABEL PRODUK & STOK
create table if not exists public.products (
    id text primary key,
    kategori text not null check (kategori in ('Acc', 'Atk', 'Voucher')),
    model text not null,
    awal int not null default 0,
    tambah int not null default 0,
    sisa int not null default 0,
    terjual int not null default 0,
    akhir int not null default 0,
    modal int not null default 0, -- dalam ribuan
    jual int not null default 0,  -- dalam ribuan
    omset int not null default 0,
    laba int not null default 0,
    updated_at timestamptz default now()
);

-- 3. TABEL PENJUALAN PRODUK
create table if not exists public.product_sales (
    id text primary key,
    product_id text references public.products(id) on delete cascade,
    kategori text not null,
    model text not null,
    modal int not null default 0,
    jual int not null default 0,
    waktu bigint not null,
    created_at timestamptz default now()
);

-- 4. TABEL TRANSAKSI KEUANGAN
create table if not exists public.financial_transactions (
    id text primary key,
    channel text not null check (channel in ('Bank', 'Dana', 'Ovo', 'BCA')),
    baris int not null,
    saldo_awal bigint not null default 0,
    transaksi text,
    nominal int not null default 0,
    laba int not null default 0,
    saldo_akhir bigint not null default 0,
    updated_at timestamptz default now()
);

-- 5. TABEL PENGELUARAN
create table if not exists public.expenses (
    id text primary key,
    nomor int not null,
    nama text not null,
    jumlah int not null default 0,
    keterangan text,
    jenis text default 'ADMIN' check (jenis in ('ADMIN', 'OPERASIONAL')),
    created_at bigint not null
);

-- 6. TABEL BUKU KASBON (PIUTANG)
create table if not exists public.kasbon (
    id text primary key,
    nama text not null,
    nominal bigint not null default 0,
    keterangan text,
    lunas boolean default false,
    tanggal_dibuat bigint not null,
    tanggal_lunas bigint
);

-- 7. TABEL CLOSING HARIAN
create table if not exists public.daily_closings (
    id text primary key,
    tanggal date not null unique default current_date,
    omset bigint not null default 0,
    laba_kotor bigint not null default 0,
    laba_bersih bigint not null default 0,
    cash_drawer bigint not null default 0,
    timestamp bigint not null,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.product_sales enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.kasbon enable row level security;
alter table public.daily_closings enable row level security;

-- Izinkan akses publik via Anon Key (Cocok untuk toko lokal / POS pribadi)
create policy "Allow all actions for anon on products" on public.products for all using (true) with check (true);
create policy "Allow all actions for anon on product_sales" on public.product_sales for all using (true) with check (true);
create policy "Allow all actions for anon on financial_transactions" on public.financial_transactions for all using (true) with check (true);
create policy "Allow all actions for anon on expenses" on public.expenses for all using (true) with check (true);
create policy "Allow all actions for anon on kasbon" on public.kasbon for all using (true) with check (true);
create policy "Allow all actions for anon on daily_closings" on public.daily_closings for all using (true) with check (true);
