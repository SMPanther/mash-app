-- Run this in your Supabase SQL editor — safe to run on top of a project
-- where you've already applied an earlier version of schema.sql. Every
-- statement here is either "create or replace" or "add column if not
-- exists", so nothing errors on things that already exist.

-- 1. THE CRITICAL FIX — this is what was breaking every checkout.
--    Drop the old buggy trigger first (it doesn't exist under this name
--    if you're on an even older version — that's fine, DROP IF EXISTS
--    just no-ops).
drop trigger if exists trg_order_status on orders;

create or replace function set_order_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function log_order_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
-- security definer is the critical part here — without it, this trigger
-- runs as whoever triggered the update (e.g. an admin's own login), and
-- since order_status_history has RLS enabled with only a SELECT policy
-- (no INSERT policy for anyone), every single status change failed with
-- "new row violates row-level security policy for table
-- order_status_history". This one line fixes that.

drop trigger if exists trg_order_set_updated_at on orders;
create trigger trg_order_set_updated_at
  before insert or update on orders
  for each row execute function set_order_updated_at();

drop trigger if exists trg_order_status_history on orders;
create trigger trg_order_status_history
  after insert or update on orders
  for each row execute function log_order_status_change();

-- 2. profiles.email + default_address, and the signup trigger capturing
--    both name and email (needed for the admin coupon-by-email lookup
--    and the checkout saved-address feature).
alter table profiles add column if not exists email text;
alter table profiles add column if not exists default_address text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, name, email)
  values (new.id, 'customer', new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 3. Hero spotlight flag on menu_items.
alter table menu_items add column if not exists featured boolean default false;
