-- 1. Helper Function
create or replace function public.get_auth_property_id()
returns uuid as $$
  select property_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer stable;

-- 2. Add property_id to Guests for isolation
-- (Removed invalid syntax)
alter table public.guests add column if not exists property_id uuid references public.properties(id);
-- For existing guests, we might need a default or manual update. For MVP assume new or blank is ok (hidden).

-- 3. Drop existing permissive policies
drop policy if exists "Enable all for authenticated users" on public.properties;
drop policy if exists "Enable all for authenticated users" on public.profiles;
drop policy if exists "Enable all for authenticated users" on public.units;
drop policy if exists "Enable all for authenticated users" on public.guests;
drop policy if exists "Enable all for authenticated users" on public.bookings;
drop policy if exists "Enable all for authenticated users" on public.tickets;

-- Drop Financials/Housekeeping permissive policies if they exist (named differently in prev migrations)
drop policy if exists "Enable read access for authenticated users" on public.extras;
drop policy if exists "Enable write access for authenticated users" on public.extras;
drop policy if exists "Enable read access for authenticated users" on public.booking_extras;
drop policy if exists "Enable write access for authenticated users" on public.booking_extras;
drop policy if exists "Enable read access for authenticated users" on public.invoices;
drop policy if exists "Enable write access for authenticated users" on public.invoices;
drop policy if exists "Enable read access for authenticated users" on public.payments;
drop policy if exists "Enable write access for authenticated users" on public.payments;
drop policy if exists "Enable read access for authenticated users" on public.housekeeping_tasks;
drop policy if exists "Enable insert for authenticated users" on public.housekeeping_tasks;
drop policy if exists "Enable update for authenticated users" on public.housekeeping_tasks;

-- 4. STRICT POLICIES

-- PROPERTIES: Read-only your own property
drop policy if exists "Read own property" on public.properties;
create policy "Read own property" on public.properties
  for select using (id = get_auth_property_id());

-- PROFILES: Read profiles in same property
-- Allow reading own profile unconditionally (breaks recursion for property_id lookup)
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Read same property profiles" on public.profiles;
create policy "Read same property profiles" on public.profiles
  for select using (property_id = get_auth_property_id());

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update using (id = auth.uid());

-- UNITS
drop policy if exists "Units isolation" on public.units;
create policy "Units isolation" on public.units
  for all using (property_id = get_auth_property_id());

-- GUESTS
drop policy if exists "Guests isolation" on public.guests;
create policy "Guests isolation" on public.guests
  for all using (property_id = get_auth_property_id());

-- BOOKINGS
drop policy if exists "Bookings isolation" on public.bookings;
create policy "Bookings isolation" on public.bookings
  for all using (property_id = get_auth_property_id());

-- TICKETS
drop policy if exists "Tickets isolation" on public.tickets;
create policy "Tickets isolation" on public.tickets
  for all using (property_id = get_auth_property_id());

-- EXTRAS
drop policy if exists "Extras isolation" on public.extras;
create policy "Extras isolation" on public.extras
  for all using (property_id = get_auth_property_id());

-- BOOKING_EXTRAS (via booking)
drop policy if exists "Booking Extras isolation" on public.booking_extras;
create policy "Booking Extras isolation" on public.booking_extras
  for all using (
    booking_id in (select id from public.bookings where property_id = get_auth_property_id())
  );

-- INVOICES (via booking)
drop policy if exists "Invoices isolation" on public.invoices;
create policy "Invoices isolation" on public.invoices
  for all using (
    booking_id in (select id from public.bookings where property_id = get_auth_property_id())
  );

-- PAYMENTS (via invoice -> booking)
drop policy if exists "Payments isolation" on public.payments;
create policy "Payments isolation" on public.payments
  for all using (
    invoice_id in (
      select id from public.invoices where booking_id in (
        select id from public.bookings where property_id = get_auth_property_id()
      )
    )
  );

-- HOUSEKEEPING_TASKS (via unit)
drop policy if exists "Housekeeping isolation" on public.housekeeping_tasks;
create policy "Housekeeping isolation" on public.housekeeping_tasks
  for all using (
    unit_id in (select id from public.units where property_id = get_auth_property_id())
  );

-- 5. Role Restrictions (Optional refinements)
-- Prevent 'reception' from deleting units/properties/etc.
-- (Supabase default is ALL if policy passes, implementing specific role checks in policy is verbose, 
--  usually handled in app logic or separate Delete policies. For MVP Strict Owner Isolation is key.)
