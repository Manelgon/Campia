-- Create table for storing immutable daily rates snapshot
create table if not exists public.booking_daily_rates (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  date date not null,
  price numeric(10, 2) not null,
  source text not null, -- 'Tarifa Base', 'Tarifa Especial (Unidad)', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate dates for the same booking
  constraint unique_booking_date unique (booking_id, date)
);

-- Enable RLS
alter table public.booking_daily_rates enable row level security;

-- Policy: Allow read/write for authenticated users (simplified for MVP)
-- In a real multi-tenant app, you should check property ownership via booking_id -> property_id
create policy "Enable all for authenticated users" on public.booking_daily_rates
    for all to authenticated using (true);
