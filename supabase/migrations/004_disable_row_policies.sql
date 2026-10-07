-- Disable row-level access policies for every application table in public.
-- This also cleans databases that were created with older migrations.

do $$
declare
  table_record record;
  policy_record record;
begin
  for table_record in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = table_record.schema_name
        and tablename = table_record.table_name
    loop
      execute format(
        'drop policy if exists %I on %I.%I',
        policy_record.policyname,
        table_record.schema_name,
        table_record.table_name
      );
    end loop;

    execute format(
      'alter table %I.%I disable row level security',
      table_record.schema_name,
      table_record.table_name
    );
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

drop function if exists public.current_user_role();
