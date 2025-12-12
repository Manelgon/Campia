-- 1. Create Payment Methods Table
create table if not exists public.payment_methods (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) not null,
  name text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enhance Invoices Table (Modifying existing if needed, or ensuring structure)
-- Note: 'invoices' was created in 02_financials. Check if we need to add columns.
-- We need: total_pagado, estado (check constraints), numero (serial - already exists).
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'invoices' and column_name = 'total_paid') then
        alter table public.invoices add column total_paid numeric not null default 0;
    end if;
    -- Ensure status check constraint exists or is compatible
    -- We'll drop existing check if strictly needed, but let's assume 'pending', 'paid', 'cancelled' fits 'anulado' mapping.
    -- Let's standardize on standard codes: pending, paid, cancelled.
end $$;

-- 3. Create Invoice Items Table (Line Items)
create table if not exists public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(12,2) not null, -- stored calculated value
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enhance/Fix Payments Table
-- We need to link to payment_methods instead of text 'method' if possible, 
-- BUT 'payments' already exists with 'method' text. 
-- We will Add 'payment_method_id' and make it optional for legacy, or migratable.
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'payments' and column_name = 'payment_method_id') then
        alter table public.payments add column payment_method_id uuid references public.payment_methods(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'payments' and column_name = 'status') then
        alter table public.payments add column status text default 'completed'; -- pending, completed, cancelled
    end if;
end $$;


-- 5. RLS POLICIES for New Tables

-- PAYMENT METHODS
alter table public.payment_methods enable row level security;

create policy "Payment Methods isolation" on public.payment_methods
  for all using (property_id = get_auth_property_id());

-- INVOICE ITEMS
alter table public.invoice_items enable row level security;

create policy "Invoice Items isolation" on public.invoice_items
  for all using (
    invoice_id in (
      select id from public.invoices where booking_id in (
        select id from public.bookings where property_id = get_auth_property_id()
      )
    )
  );


-- 6. VIEWS FOR REPORTING
-- (Using dynamic SQL to avoid errors if dependent objects don't exist yet, although strictly in migration order it should be fine)

-- View: Pagos Pendientes (Pending Payments)
create or replace view view_pending_payments as
select 
  p.id,
  i.invoice_number as numero_factura,
  p.amount as monto,
  coalesce(pm.name, p.method) as metodo,
  p.created_at as fecha, -- using created_at as date
  i.booking_id
from public.payments p
join public.invoices i on p.invoice_id = i.id
left join public.payment_methods pm on p.payment_method_id = pm.id
where p.status = 'pending';

-- View: Ingresos Diarios (Daily Income)
create or replace view view_daily_income as
select 
  date(p.created_at) as dia,
  coalesce(pm.name, p.method) as metodo,
  sum(p.amount) as total_ingresos,
  count(p.id) as num_transacciones
from public.payments p
left join public.payment_methods pm on p.payment_method_id = pm.id
where p.status = 'completed' or p.status = 'abonado' -- cover both standards
group by date(p.created_at), coalesce(pm.name, p.method);

-- View: Reporte Facturacion (Billing Report)
create or replace view view_billing_report as
select 
  date(i.created_at) as fecha_factura,
  count(i.id) as total_facturas,
  sum(i.total_amount) as importe_total,
  sum(i.total_paid) as total_pagado
from public.invoices i
where i.status != 'cancelled'
group by date(i.created_at)
order by date(i.created_at);

-- 7. Seed Default Payment Methods (Trigger based or manual?)
-- We can't easily seed for ALL properties since we don't know them all in a static migration.
-- Better to have a function or handle it in app. 
-- For now, let's just leave the table. The app should allow creating them.

