-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null, -- 'yiyecek', 'icecek', etc.
  price numeric not null,
  stock integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stock Logs Table (Internal use)
create table stock_logs (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  delta integer not null, -- Positive for return, negative for sale
  action text not null, -- 'sale' or 'return'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table products enable row level security;
alter table stock_logs enable row level security;

-- Public READ approach for Menu (since auth is only for admin)
-- Ideally we might want strict RLS, but for a simple /menu public page:
create policy "Public Read Products" on products
  for select using (true);

-- Admin Only policies (Assuming admin users have authenticated via Supabase Auth)
-- Adjust 'authenticated' role check as per project needs (or strict email check)
create policy "Admin All Products" on products
  for all using (auth.role() = 'authenticated');

create policy "Admin All Logs" on stock_logs
  for all using (auth.role() = 'authenticated');


-- RPC Function: update_stock
-- Handles atomic updates to prevent race conditions and ensure consistency
create or replace function update_stock(p_id uuid, quantity integer)
returns void
language plpgsql
security definer
as $$
declare
  current_stock integer;
  change_type text;
begin
  -- Determine action type based on sign
  if quantity < 0 then
    change_type := 'sale';
  else
    change_type := 'return';
  end if;

  -- Lock row for update
  select stock into current_stock from products where id = p_id for update;

  if not found then
    raise exception 'Product not found';
  end if;

  -- Validation: Stock cannot go below 0
  if current_stock + quantity < 0 then
    raise exception 'Yetersiz stok (Mevcut: %)', current_stock;
  end if;

  -- Update product
  update products
  set stock = stock + quantity
  where id = p_id;

  -- Log transaction
  insert into stock_logs (product_id, delta, action)
  values (p_id, quantity, change_type);

end;
$$;
