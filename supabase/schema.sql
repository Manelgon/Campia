-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ROLES definition is handled by Supabase Auth (auth.users), but we need a public profiles table
-- Create specific enums
create type user_role as enum ('superadmin', 'admin', 'reception', 'maintenance', 'housekeeping');
create type unit_status as enum ('clean', 'dirty', 'occupied', 'maintenance', 'out_of_order');
create type booking_status as enum ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');
create type payment_status as enum ('pending', 'partial', 'paid', 'refunded');
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'critical');

-- PROPERTIES
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- PROFILES (Linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role user_role default 'reception',
  property_id uuid references public.properties(id),
  created_at timestamp with time zone default now()
);

-- UNITS
create table public.units (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) not null,
  name text not null,
  type text not null, -- e.g., 'parcela', 'bungalow'
  capacity int default 2,
  price_per_night decimal(10, 2) default 0.00,
  status unit_status default 'clean',
  created_at timestamp with time zone default now()
);

-- GUESTS
create table public.guests (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text,
  document_id text,
  nationality text,
  notes text,
  created_at timestamp with time zone default now()
);

-- BOOKINGS
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) not null,
  unit_id uuid references public.units(id),
  guest_id uuid references public.guests(id),
  check_in_date date not null,
  check_out_date date not null,
  real_check_in timestamp with time zone,
  real_check_out timestamp with time zone,
  status booking_status default 'confirmed',
  total_amount decimal(10, 2) default 0.00,
  payment_status payment_status default 'pending',
  guests_count int default 1,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- MAINTENANCE / TICKETS
create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) not null,
  unit_id uuid references public.units(id),
  title text not null,
  description text,
  status ticket_status default 'open',
  priority ticket_priority default 'medium',
  reported_by uuid references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- TASKS (Housekeeping/Maintenance specific tasks if separate from tickets, or can be same)
-- For now, we assume Tickets covers maintenance and cleaning issues, 
-- but routine cleaning is often implicit inUnit Status or separate.
-- Let's add a log for cleaning/status changes if needed, but for MVP keep it simple.

-- RLS POLICIES (Simplified for now - enable RLS and allow all for dev, or specific)
alter table public.properties enable row level security;
alter table public.profiles enable row level security;
alter table public.units enable row level security;
alter table public.guests enable row level security;
alter table public.bookings enable row level security;
alter table public.tickets enable row level security;

-- Basic policy: allow authenticated users to do everything for now (refine later)
create policy "Enable all for authenticated users" on public.properties for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.profiles for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.units for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.guests for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.bookings for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.tickets for all to authenticated using (true);

-- Allow public read for properties if needed (unlikely for PMS)
-- Handle profile creation on signup (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'reception'); -- Default role
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
