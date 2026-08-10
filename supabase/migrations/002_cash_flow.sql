-- Kasirpuintar v2: expenses menjadi ledger kas (pemasukan/pengeluaran)
-- Jalankan di Supabase SQL editor setelah 001_init.sql.

alter table public.expenses add column if not exists "type" text not null default 'expense';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_type_check' and conrelid = 'public.expenses'::regclass) then
    alter table public.expenses add constraint expenses_type_check check (type in ('income', 'expense'));
  end if;
end$$;

create index if not exists idx_expenses_type on public.expenses (type);
