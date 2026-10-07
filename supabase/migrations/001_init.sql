create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'users') then
    create table public.users (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      email text not null unique,
      role text not null check (role in ('owner', 'cashier')) default 'cashier',
      pin_hash text,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.users add column if not exists name text not null default '';
    alter table public.users add column if not exists email text;
    alter table public.users add column if not exists role text not null default 'cashier';
    alter table public.users add column if not exists pin_hash text;
    alter table public.users add column if not exists active boolean not null default true;
    alter table public.users add column if not exists created_at timestamptz not null default now();
    alter table public.users add column if not exists updated_at timestamptz not null default now();
    alter table public.users add column if not exists deleted_at timestamptz;

    -- Add constraints if missing
    alter table public.users alter column id set default gen_random_uuid();
    if not exists (select 1 from pg_constraint where conname = 'users_role_check' and conrelid = 'public.users'::regclass) then
      alter table public.users add constraint users_role_check check (role in ('owner', 'cashier'));
    end if;
    if not exists (select 1 from pg_constraint where conname = 'users_email_key' and conrelid = 'public.users'::regclass) then
      alter table public.users add constraint users_email_key unique (email);
    end if;
    if not exists (select 1 from pg_constraint where conname = 'users_pkey' and conrelid = 'public.users'::regclass) then
      alter table public.users add primary key (id);
    end if;
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'categories') then
    create table public.categories (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.categories add column if not exists name text not null default '';
    alter table public.categories add column if not exists sort_order integer not null default 0;
    alter table public.categories add column if not exists created_at timestamptz not null default now();
    alter table public.categories add column if not exists updated_at timestamptz not null default now();
    alter table public.categories add column if not exists deleted_at timestamptz;
    alter table public.categories alter column id set default gen_random_uuid();
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'products') then
    create table public.products (
      id uuid primary key default gen_random_uuid(),
      sku text not null,
      barcode text,
      name text not null,
      category_id uuid not null references public.categories (id),
      price bigint not null default 0,
      cogs bigint not null default 0,
      stock integer not null default 0,
      image_url text,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.products alter column id set default gen_random_uuid();
    alter table public.products add column if not exists sku text not null default '';
    alter table public.products add column if not exists barcode text;
    alter table public.products add column if not exists name text not null default '';
    alter table public.products add column if not exists category_id uuid;
    alter table public.products add column if not exists price bigint not null default 0;
    alter table public.products add column if not exists cogs bigint not null default 0;
    alter table public.products add column if not exists stock integer not null default 0;
    alter table public.products add column if not exists image_url text;
    alter table public.products add column if not exists active boolean not null default true;
    alter table public.products add column if not exists created_at timestamptz not null default now();
    alter table public.products add column if not exists updated_at timestamptz not null default now();
    alter table public.products add column if not exists deleted_at timestamptz;
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'shifts') then
    create table public.shifts (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.users (id),
      clock_in_at timestamptz not null,
      clock_out_at timestamptz,
      opening_cash bigint not null default 0,
      closing_cash bigint,
      sales_total bigint not null default 0,
      expense_total bigint not null default 0,
      status text not null check (status in ('open', 'closed')) default 'open',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.shifts alter column id set default gen_random_uuid();
    alter table public.shifts add column if not exists user_id uuid;
    alter table public.shifts add column if not exists clock_in_at timestamptz;
    alter table public.shifts add column if not exists clock_out_at timestamptz;
    alter table public.shifts add column if not exists opening_cash bigint not null default 0;
    alter table public.shifts add column if not exists closing_cash bigint;
    alter table public.shifts add column if not exists sales_total bigint not null default 0;
    alter table public.shifts add column if not exists expense_total bigint not null default 0;
    alter table public.shifts add column if not exists status text not null default 'open';
    alter table public.shifts add column if not exists created_at timestamptz not null default now();
    alter table public.shifts add column if not exists updated_at timestamptz not null default now();
    alter table public.shifts add column if not exists deleted_at timestamptz;
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'transactions') then
    create table public.transactions (
      id uuid primary key default gen_random_uuid(),
      shift_id uuid not null references public.shifts (id),
      user_id uuid not null references public.users (id),
      subtotal bigint not null,
      discount bigint not null default 0,
      total bigint not null,
      payment_method text not null check (payment_method in ('cash', 'qris', 'transfer')),
      paid bigint not null,
      change bigint not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.transactions alter column id set default gen_random_uuid();
    alter table public.transactions add column if not exists shift_id uuid;
    alter table public.transactions add column if not exists user_id uuid;
    alter table public.transactions add column if not exists subtotal bigint not null default 0;
    alter table public.transactions add column if not exists discount bigint not null default 0;
    alter table public.transactions add column if not exists total bigint not null default 0;
    alter table public.transactions add column if not exists payment_method text not null default 'cash';
    alter table public.transactions add column if not exists paid bigint not null default 0;
    alter table public.transactions add column if not exists "change" bigint not null default 0;
    alter table public.transactions add column if not exists created_at timestamptz not null default now();
    alter table public.transactions add column if not exists updated_at timestamptz not null default now();
    alter table public.transactions add column if not exists deleted_at timestamptz;
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'transaction_items') then
    create table public.transaction_items (
      id uuid primary key default gen_random_uuid(),
      transaction_id uuid not null references public.transactions (id) on delete cascade,
      product_id uuid not null references public.products (id),
      product_name text not null,
      price bigint not null,
      cogs bigint not null,
      qty integer not null,
      subtotal bigint not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.transaction_items alter column id set default gen_random_uuid();
    alter table public.transaction_items add column if not exists transaction_id uuid;
    alter table public.transaction_items add column if not exists product_id uuid;
    alter table public.transaction_items add column if not exists product_name text not null default '';
    alter table public.transaction_items add column if not exists price bigint not null default 0;
    alter table public.transaction_items add column if not exists cogs bigint not null default 0;
    alter table public.transaction_items add column if not exists qty integer not null default 0;
    alter table public.transaction_items add column if not exists subtotal bigint not null default 0;
    alter table public.transaction_items add column if not exists created_at timestamptz not null default now();
    alter table public.transaction_items add column if not exists updated_at timestamptz not null default now();
    alter table public.transaction_items add column if not exists deleted_at timestamptz;
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'stock_movements') then
    create table public.stock_movements (
      id uuid primary key default gen_random_uuid(),
      product_id uuid not null references public.products (id),
      type text not null check (type in ('sale', 'restock', 'adjustment')),
      qty integer not null,
      ref_type text,
      ref_id uuid,
      note text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.stock_movements alter column id set default gen_random_uuid();
    alter table public.stock_movements add column if not exists product_id uuid;
    alter table public.stock_movements add column if not exists type text not null default 'adjustment';
    alter table public.stock_movements add column if not exists qty integer not null default 0;
    alter table public.stock_movements add column if not exists ref_type text;
    alter table public.stock_movements add column if not exists ref_id uuid;
    alter table public.stock_movements add column if not exists note text;
    alter table public.stock_movements add column if not exists created_at timestamptz not null default now();
    alter table public.stock_movements add column if not exists updated_at timestamptz not null default now();
    alter table public.stock_movements add column if not exists deleted_at timestamptz;
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'expenses') then
    create table public.expenses (
      id uuid primary key default gen_random_uuid(),
      shift_id uuid not null references public.shifts (id),
      user_id uuid not null references public.users (id),
      name text not null,
      category text not null,
      amount bigint not null,
      note text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz
    );
  else
    alter table public.expenses alter column id set default gen_random_uuid();
    alter table public.expenses add column if not exists shift_id uuid;
    alter table public.expenses add column if not exists user_id uuid;
    alter table public.expenses add column if not exists name text not null default '';
    alter table public.expenses add column if not exists category text not null default '';
    alter table public.expenses add column if not exists amount bigint not null default 0;
    alter table public.expenses add column if not exists note text;
    alter table public.expenses add column if not exists created_at timestamptz not null default now();
    alter table public.expenses add column if not exists updated_at timestamptz not null default now();
    alter table public.expenses add column if not exists deleted_at timestamptz;
  end if;
end$$;

create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_products_sku on public.products (sku);
create index if not exists idx_products_barcode on public.products (barcode);
create index if not exists idx_products_updated_at on public.products (updated_at);
create index if not exists idx_categories_updated_at on public.categories (updated_at);
create index if not exists idx_shifts_user_id on public.shifts (user_id);
create index if not exists idx_shifts_status on public.shifts (status);
create index if not exists idx_transactions_shift_id on public.transactions (shift_id);
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_created_at on public.transactions (created_at);
create index if not exists idx_transaction_items_transaction_id on public.transaction_items (transaction_id);
create index if not exists idx_transaction_items_product_id on public.transaction_items (product_id);
create index if not exists idx_stock_movements_product_id on public.stock_movements (product_id);
create index if not exists idx_stock_movements_created_at on public.stock_movements (created_at);
create index if not exists idx_expenses_shift_id on public.expenses (shift_id);
create index if not exists idx_users_updated_at on public.users (updated_at);
create index if not exists idx_shifts_updated_at on public.shifts (updated_at);
create index if not exists idx_transactions_updated_at on public.transactions (updated_at);
create index if not exists idx_transaction_items_updated_at on public.transaction_items (updated_at);
create index if not exists idx_stock_movements_updated_at on public.stock_movements (updated_at);
create index if not exists idx_expenses_updated_at on public.expenses (updated_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users for each row execute function public.touch_updated_at();
drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.touch_updated_at();
drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products for each row execute function public.touch_updated_at();
drop trigger if exists trg_shifts_updated_at on public.shifts;
create trigger trg_shifts_updated_at before update on public.shifts for each row execute function public.touch_updated_at();
drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at before update on public.transactions for each row execute function public.touch_updated_at();
drop trigger if exists trg_transaction_items_updated_at on public.transaction_items;
create trigger trg_transaction_items_updated_at before update on public.transaction_items for each row execute function public.touch_updated_at();
drop trigger if exists trg_stock_movements_updated_at on public.stock_movements;
create trigger trg_stock_movements_updated_at before update on public.stock_movements for each row execute function public.touch_updated_at();
drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at before update on public.expenses for each row execute function public.touch_updated_at();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
      alter publication supabase_realtime add table public.products;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories') then
      alter publication supabase_realtime add table public.categories;
    end if;
  end if;
end$$;
