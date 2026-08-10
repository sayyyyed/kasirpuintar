-- Relaksasi RLS untuk arsitektur local-first (kasir login lokal via PIN).
-- Semua sesi terautentikasi (termasuk anonymous sign-in) boleh membaca & menulis.
-- Per-akun auth.uid() tidak bisa dipakai karena kasir tidak punya sesi Supabase sendiri.

-- users
drop policy if exists "users_select" on public.users;
drop policy if exists "users_write" on public.users;
create policy "users_all_authenticated" on public.users
  for all to authenticated using (true) with check (true);

-- categories
drop policy if exists "categories_select" on public.categories;
drop policy if exists "categories_write" on public.categories;
create policy "categories_all_authenticated" on public.categories
  for all to authenticated using (true) with check (true);

-- products
drop policy if exists "products_select" on public.products;
drop policy if exists "products_write" on public.products;
create policy "products_all_authenticated" on public.products
  for all to authenticated using (true) with check (true);

-- shifts
drop policy if exists "shifts_select" on public.shifts;
drop policy if exists "shifts_insert" on public.shifts;
drop policy if exists "shifts_update" on public.shifts;
create policy "shifts_all_authenticated" on public.shifts
  for all to authenticated using (true) with check (true);

-- transactions
drop policy if exists "transactions_select" on public.transactions;
drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_all_authenticated" on public.transactions
  for all to authenticated using (true) with check (true);

-- transaction_items
drop policy if exists "transaction_items_select" on public.transaction_items;
drop policy if exists "transaction_items_insert" on public.transaction_items;
create policy "transaction_items_all_authenticated" on public.transaction_items
  for all to authenticated using (true) with check (true);

-- stock_movements
drop policy if exists "stock_movements_select" on public.stock_movements;
drop policy if exists "stock_movements_insert" on public.stock_movements;
create policy "stock_movements_all_authenticated" on public.stock_movements
  for all to authenticated using (true) with check (true);

-- expenses
drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
create policy "expenses_all_authenticated" on public.expenses
  for all to authenticated using (true) with check (true);
