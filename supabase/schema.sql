-- Full schema + RLS policies: see 04-database-schema.md for the annotated version.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'rider', 'customer')) default 'customer',
  name text,
  phone text,
  created_at timestamptz default now()
);

-- ============================================================
-- is_admin(): the single place "am I an admin?" is answered.
--
-- Every "admins can do X" policy below calls this instead of inlining
-- `exists (select 1 from profiles where id = auth.uid() and role = 'admin')`.
-- That inline version looks harmless but is NOT — the moment a policy on
-- profiles itself (or anything profiles' own policies depend on) needs to
-- check "is this user an admin", it triggers profiles' RLS to evaluate,
-- which runs the same admin-check subquery again, which triggers RLS
-- again — Postgres calls this "infinite recursion detected in policy for
-- relation profiles" and every query against profiles just fails outright.
-- SECURITY DEFINER makes this function run with the privileges of
-- whoever created it, bypassing RLS internally for this one lookup, so
-- the recursion never starts. This is the exact class of bug noted from
-- [[andaaz-store]]'s earlier RLS debugging — worth not repeating here.
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

alter table profiles enable row level security;

create policy "users read own profile" on profiles
  for select using (id = auth.uid());

create policy "admins read all profiles" on profiles
  for select using (public.is_admin());

-- Deliberately NO update policy for ordinary users here: profiles.role is
-- what the entire admin/rider/customer split is built on, and RLS is
-- row-level, not column-level — an update policy that let a customer edit
-- their own row would also let them set their own role to 'admin'. Name/
-- phone edits go through an admin-managed path (or a future dedicated
-- endpoint that updates only those two columns) rather than a raw table
-- update policy, until that's actually needed.
create policy "admins manage all profiles" on profiles
  for all using (public.is_admin());

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int default 0
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  rider_id uuid references profiles(id),
  status text not null check (
    status in ('received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')
  ) default 'received',
  address text,
  total numeric(10,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  quantity int not null default 1,
  price_at_order numeric(10,2) not null
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  status text not null,
  changed_by uuid references profiles(id),
  changed_at timestamptz default now()
);

create table complaints (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  customer_id uuid references profiles(id),
  category text check (category in ('late_delivery', 'wrong_item', 'quality', 'other')),
  message text not null,
  status text check (status in ('open', 'in_review', 'resolved')) default 'open',
  admin_note text,
  created_at timestamptz default now()
);

create or replace function log_order_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_order_status
  before insert or update on orders
  for each row execute function log_order_status_change();

alter table orders enable row level security;
alter table complaints enable row level security;
alter table menu_items enable row level security;
alter table menu_categories enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;

create policy "customers read own orders" on orders
  for select using (customer_id = auth.uid());

create policy "admins read all orders" on orders
  for select using (public.is_admin());

create policy "riders read assigned orders" on orders
  for select using (rider_id = auth.uid());

create policy "admin updates status" on orders
  for update using (public.is_admin());

create policy "rider marks delivered" on orders
  for update using (rider_id = auth.uid())
  with check (status = 'delivered');

create policy "customers create own orders" on orders
  for insert with check (customer_id = auth.uid());

-- order_items: readable by whoever can read the parent order (customer,
-- admin, or the assigned rider) — expressed as "does a visible order with
-- this id exist for me", which composes with the orders policies above
-- rather than duplicating the role logic here.
create policy "read order items via visible order" on order_items
  for select using (
    exists (select 1 from orders where orders.id = order_items.order_id)
  );

create policy "customers create own order items" on order_items
  for insert with check (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.customer_id = auth.uid())
  );

-- order_status_history: admin-only read for now (audit trail) — nothing
-- in the app queries this directly yet, but RLS defaults to deny-all once
-- enabled, so this is here to avoid silently blocking a future audit view.
create policy "admins read order status history" on order_status_history
  for select using (public.is_admin());

create policy "customers read own complaints" on complaints
  for select using (customer_id = auth.uid());

create policy "admins read all complaints" on complaints
  for select using (public.is_admin());

create policy "customers create complaints" on complaints
  for insert with check (customer_id = auth.uid());

create policy "admins update complaints" on complaints
  for update using (public.is_admin());

create policy "public reads menu" on menu_items for select using (true);
create policy "public reads categories" on menu_categories for select using (true);

create policy "admins write menu items" on menu_items
  for all using (public.is_admin());

create policy "admins write categories" on menu_categories
  for all using (public.is_admin());

-- ============================================================
-- Phase 2: variations, combos/meals, coupons, rider location
-- See 07-phase2-features.md for the reasoning behind each of these.
-- ============================================================

-- Variations (e.g. Pizza: Small / Medium / Large), each with its own price.
create table menu_item_variations (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  name text not null,             -- admin-named, e.g. "Small", "Large", "12 inch"
  price numeric(10,2) not null,
  is_default boolean default false,
  sort_order int default 0
);

-- A combo/meal is itself a menu_item (category = Deals & combos) whose
-- actual contents are defined here: which other menu_items go in it,
-- which variation of each, and how many.
create table combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_menu_item_id uuid references menu_items(id) on delete cascade,
  component_menu_item_id uuid references menu_items(id),
  component_variation_id uuid references menu_item_variations(id),
  quantity int not null default 1
);

alter table menu_item_variations enable row level security;
alter table combo_items enable row level security;

create policy "public reads variations" on menu_item_variations for select using (true);
create policy "admins write variations" on menu_item_variations for all using (public.is_admin());

create policy "public reads combo items" on combo_items for select using (true);
create policy "admins write combo items" on combo_items for all using (public.is_admin());

-- order_items needs to record which variation was chosen (nullable —
-- not every item has variations) at time of order.
alter table order_items add column variation_id uuid references menu_item_variations(id);

-- Coupons: always tied to one specific customer (per the brief — "only
-- be used by him"), created by an admin, optionally linked to the
-- complaint that prompted it.
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid references profiles(id) not null,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null default 'percentage',
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  related_complaint_id uuid references complaints(id),
  is_used boolean default false,
  used_on_order_id uuid references orders(id),
  created_by uuid references profiles(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table coupons enable row level security;

create policy "customers read own coupons" on coupons
  for select using (customer_id = auth.uid());

create policy "admins manage coupons" on coupons
  for all using (public.is_admin());

-- Rider live location — only written by the rider themselves, read by
-- admin and by the customer for their own assigned order (join through
-- orders.rider_id). Free to run: no paid maps API required, see
-- 07-phase2-features.md.
create table rider_locations (
  rider_id uuid primary key references profiles(id),
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz default now()
);

alter table rider_locations enable row level security;

create policy "rider writes own location" on rider_locations
  for all using (rider_id = auth.uid())
  with check (rider_id = auth.uid());

create policy "admins read all rider locations" on rider_locations
  for select using (public.is_admin());

create policy "customers read assigned rider location" on rider_locations
  for select using (
    exists (
      select 1 from orders
      where orders.rider_id = rider_locations.rider_id
      and orders.customer_id = auth.uid()
      and orders.status = 'out_for_delivery'
    )
  );

-- Widen complaints with a resolution action + link to any coupon issued
-- as compensation, per the resolution flow in 07-phase2-features.md §5.
alter table complaints add column resolution_action text
  check (resolution_action in ('contacted_rider', 'redelivered_free', 'discount_issued', 'apology_only', 'other'));
alter table complaints add column issued_coupon_id uuid references coupons(id);

-- ============================================================
-- Auto-create a profiles row on signup.
-- Without this, every new auth.users signup has NO matching profiles
-- row, so the login redirect (which reads profiles.role) has nothing
-- to read — this is what you need for admin/rider test accounts to
-- work at all. Defaults everyone to 'customer'; promote specific users
-- to 'admin'/'rider' manually afterward (see the setup notes).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
