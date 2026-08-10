-- Kehadiran & Penggajian Karyawan
-- hourly_rate pada users (opsional, hanya muncul jika sistem upah di-enable di Settings)
-- payroll_periods menyimpan ringkasan upah per-periode per karyawan

alter table public.users add column if not exists hourly_rate bigint;

create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  period_start date not null,
  period_end date not null,
  total_hours numeric(6,1) not null default 0,
  hourly_rate bigint not null default 0,
  gross_pay bigint not null default 0,
  status text not null check (status in ('pending', 'paid')) default 'pending',
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_payroll_periods_user_id on public.payroll_periods (user_id);
create index if not exists idx_payroll_periods_status on public.payroll_periods (status);

alter table public.payroll_periods enable row level security;

drop policy if exists "payroll_periods_all_authenticated" on public.payroll_periods;
create policy "payroll_periods_all_authenticated" on public.payroll_periods
  for all to authenticated using (true) with check (true);
