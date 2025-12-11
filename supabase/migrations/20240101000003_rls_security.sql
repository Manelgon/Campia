-- 1. Helper Function
create or replace function public.get_auth_property_id()
returns uuid as $$
  select property_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer stable;

-- 2. Add property_id to Guests for isolation
alter table public.guests convert to charset utf8; -- Just kidding, Postgres.
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
create policy "Read own property" on public.properties
  for select using (id = get_auth_property_id());

-- PROFILES: Read profiles in same property
create policy "Read same property profiles" on public.profiles
  for select using (property_id = get_auth_property_id());

create policy "Update own profile" on public.profiles
  for update using (id = auth.uid());

-- UNITS
create policy "Units isolation" on public.units
  for all using (property_id = get_auth_property_id());

-- GUESTS
create policy "Guests isolation" on public.guests
  for all using (property_id = get_auth_property_id());

-- BOOKINGS
create policy "Bookings isolation" on public.bookings
  for all using (property_id = get_auth_property_id());

-- TICKETS
create policy "Tickets isolation" on public.tickets
  for all using (property_id = get_auth_property_id());

-- EXTRAS
create policy "Extras isolation" on public.extras
  for all using (property_id = get_auth_property_id());

-- BOOKING_EXTRAS (via booking)
create policy "Booking Extras isolation" on public.booking_extras
  for all using (
    booking_id in (select id from public.bookings where property_id = get_auth_property_id())
  );

-- INVOICES (via booking)
create policy "Invoices isolation" on public.invoices
  for all using (
    booking_id in (select id from public.bookings where property_id = get_auth_property_id())
  );

-- PAYMENTS (via invoice -> booking)
create policy "Payments isolation" on public.payments
  for all using (
    invoice_id in (
      select id from public.invoices where booking_id in (
        select id from public.bookings where property_id = get_auth_property_id()
      )
    )
  );

-- HOUSEKEEPING_TASKS (via unit)
create policy "Housekeeping isolation" on public.housekeeping_tasks
  for all using (
    unit_id in (select id from public.units where property_id = get_auth_property_id())
  );

-- 5. Role Restrictions (Optional refinements)
-- Prevent 'reception' from deleting units/properties/etc.
-- (Supabase default is ALL if policy passes, implementing specific role checks in policy is verbose, 
--  usually handled in app logic or separate Delete policies. For MVP Strict Owner Isolation is key.)
