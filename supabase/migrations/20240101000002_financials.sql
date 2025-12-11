-- Create extras table
create table if not exists public.extras (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric not null default 0,
  type text default 'service', -- service, product
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create booking_extras table (Join table)
create table if not exists public.booking_extras (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  extra_id uuid references public.extras(id) on delete cascade not null,
  quantity integer default 1,
  total_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create invoices table
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  invoice_number serial, -- Simple auto-increment for MVP
  total_amount numeric not null default 0,
  status text default 'pending', -- pending, paid, cancelled
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paid_at timestamp with time zone
);

-- Create payments table
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  amount numeric not null,
  method text not null, -- cash, card, transfer
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.extras enable row level security;
alter table public.booking_extras enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

-- Basic authenticated access for MVP
create policy "Enable read access for authenticated users" on public.extras for select using (auth.role() = 'authenticated');
create policy "Enable write access for authenticated users" on public.extras for all using (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users" on public.booking_extras for select using (auth.role() = 'authenticated');
create policy "Enable write access for authenticated users" on public.booking_extras for all using (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users" on public.invoices for select using (auth.role() = 'authenticated');
create policy "Enable write access for authenticated users" on public.invoices for all using (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users" on public.payments for select using (auth.role() = 'authenticated');
create policy "Enable write access for authenticated users" on public.payments for all using (auth.role() = 'authenticated');

-- Seed some extras
-- Seed data moved to seed.sql to avoid foreign key errors during migration
