-- 1. Maliyet Kolonu Ekle (Eğer yoksa)
alter table products 
add column if not exists cost numeric default 0;

-- 2. Raporlama Fonksiyonunu Güncelle (Net Kâr eklenmiş hali)
create or replace function get_sales_report(
  start_date timestamp with time zone,
  end_date timestamp with time zone
)
returns table (
  product_name text,
  category text,
  quantity_sold integer,
  revenue numeric,
  profit numeric -- Yeni: Net Kâr
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.name as product_name,
    p.category,
    sum(abs(sl.delta))::integer as quantity_sold,
    sum(abs(sl.delta) * p.price) as revenue,
    -- Net Kâr = (Fiyat - Maliyet) * Satılan Adet
    sum(abs(sl.delta) * (p.price - COALESCE(p.cost, 0))) as profit
  from stock_logs sl
  join products p on sl.product_id = p.id
  where 
    sl.created_at >= start_date 
    and sl.created_at <= end_date
    and sl.action = 'sale'
  group by p.id, p.name, p.category, p.price, p.cost
  order by profit desc; -- En çok kâr getiren en tepede
end;
$$;
