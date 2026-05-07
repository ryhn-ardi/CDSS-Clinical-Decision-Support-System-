# Setup Supabase untuk Aplikasi CDSS

Aplikasi ini menggunakan [Supabase](https://supabase.com/) sebagai backend untuk sinkronisasi data ke Cloud. Ikuti langkah-langkah di bawah ini untuk menghubungkan aplikasi Anda dengan Supabase.

## 1. Buat Proyek Supabase
1. Buka [Supabase](https://supabase.com/) dan login/daftar.
2. Klik **New Project**, beri nama (misal: `cdss-app`), masukkan password database, dan pilih region terdekat (misal: Singapore).
3. Tunggu hingga proyek selesai dibuat.

## 2. Masukkan Kredensial ke AI Studio
1. Di dashboard Supabase, buka menu **Project Settings** (ikon roda gigi) -> **API**.
2. Salin nilai **Project URL** dan masukkan ke AI Studio sebagai variabel environment:
   * Key: `VITE_SUPABASE_URL`
   * Value: `(Paste URL Anda di sini)`
3. Salin nilai **Project API keys (anon / public)** dan masukkan ke AI Studio:
   * Key: `VITE_SUPABASE_ANON_KEY`
   * Value: `(Paste Anon Key Anda di sini)`

## 3. Jalankan SQL Script untuk Setup Database
Kita perlu membuat tabel untuk menyimpan data Obat dan Audit Log.
1. Di dashboard Supabase, buka menu **SQL Editor** (berada di sidebar kiri).
2. Klik **New Query**.
3. *Copy* dan *Paste* kode SQL berikut ke editor, lalu klik **Run**:

```sql
-- Create table for Drugs
create table public.drugs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null, -- Mengkaitkan obat dengan dokter tertentu
    name text not null,
    dose_mg_per_kg numeric not null,
    concentration_mg numeric not null,
    volume_ml numeric not null,
    max_dose_mg numeric,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for Audit Logs
create table public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    action text not null,
    details text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hapus policy yang ada jika pernah dibuat
DROP POLICY IF EXISTS "Users can only access their own drugs" ON public.drugs;
DROP POLICY IF EXISTS "Users can only access their own audit logs" ON public.audit_logs;

-- Enable Row Level Security (RLS) untuk keamanan
alter table public.drugs enable row level security;
alter table public.audit_logs enable row level security;

-- Policies for drugs: Dokter hanya bisa melihat dan mengelola obatnya sendiri
create policy "Users can modify their own drugs"
on public.drugs for all
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

create policy "Users can modify their own audit logs"
on public.audit_logs for all
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );
```

## 4. Konfigurasi Autentikasi (PENTING)
Aplikasi ini menggunakan kombinasi "Username & PIN" untuk login cepat, yang di balik layar diterjemahkan menjadi Email & Password standar oleh Supabase.
Supabase secara default mengaktifkan konfirmasi email untuk user baru. Kita harus **mematikannya** agar fitur Auto-Registration berjalan instan.

1. Buka menu **Authentication** di sidebar kiri.
2. Pilih **Providers** -> **Email**.
3. Pastikan **Enable Email provider** dalam keadaan *aktif* (ON).
4. Matikan / hilangkan centang pada **Confirm email** (Kirim email konfirmasi).
5. Klik **Save**.

### Selesai!
Aplikasi siap disinkronisasi ke Cloud! Jika Anda tidak terhubung ke internet, aplikasi akan menyimpan data sementara di browser (Offline-First) dan melakukan sinkronisasi saat koneksi tersedia.
