-- Kasirpuintar v3: buka sinkronisasi untuk perangkat kasir.
-- Kasir login lokal via PIN (tanpa akun Supabase), sehingga sesi device adalah
-- "anonim". Tanpa relaksasi ini, perangkat kasir tidak bisa menarik katalog
-- produk/kategori dari pemilik, dan tidak bisa mengirim transaksi ke server.
-- Model keamanan app: client di-trust (id dibuat di device, soft delete),
-- sehingga RLS difungsikan untuk memisahkan data, bukan menolak device kasir.

-- Katalog: readable untuk semua (termasuk perangkat kasir tanpa akun)
drop policy if exists "products_select" on public.products;
create policy "products_select" on public.products
  for select using (true);

drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories
  for select using (true);

-- Produk: kasir meng-update stok saat transaksi berjalan (dikirim via sync)
drop policy if exists "products_write" on public.products;
create policy "products_write" on public.products
  for all using (true) with check (true);

-- Writes app-managed dari device kasir (sesi anonim)
drop policy if exists "shifts_insert" on public.shifts;
create policy "shifts_insert" on public.shifts
  for insert with check (true);

drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_insert" on public.transactions
  for insert with check (true);

drop policy if exists "transaction_items_insert" on public.transaction_items;
create policy "transaction_items_insert" on public.transaction_items
  for insert with check (true);

drop policy if exists "stock_movements_insert" on public.stock_movements;
create policy "stock_movements_insert" on public.stock_movements
  for insert with check (true);

drop policy if exists "expenses_insert" on public.expenses;
create policy "expenses_insert" on public.expenses
  for insert with check (true);
