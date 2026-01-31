-- Raporlama Fonksiyonu
-- Bu fonksiyon frontend'den tarih aralığı alıp ürün bazlı satışları ve ciroyu döner.

create or replace function get_sales_report(
  start_date timestamp with time zone,
  end_date timestamp with time zone
)
returns table (
  product_name text,
  category text,
  quantity_sold integer,
  revenue numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.name as product_name,
    p.category,
    -- Delta negatiftir (satış), o yüzden ABS (mutlak değer) alıyoruz
    sum(abs(sl.delta))::integer as quantity_sold,
    sum(abs(sl.delta) * p.price) as revenue
  from stock_logs sl
  join products p on sl.product_id = p.id
  where 
    sl.created_at >= start_date 
    and sl.created_at <= end_date
    and sl.action = 'sale' -- Sadece satışları al, iadeleri karıştırma (veya iadeleri düşmek istersen mantığı değiştirebiliriz)
  group by p.id, p.name, p.category, p.price
  order by revenue desc; -- Cirosu en yüksek olan en tepede
end;
$$;
