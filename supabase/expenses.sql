-- Giderler Tablosu
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Güvenlik)
alter table expenses enable row level security;

-- Adminler her şeyi yapabilir
create policy "Admin All Expenses" on expenses for all using (auth.role() = 'authenticated');
