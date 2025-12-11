-- Create housekeeping_tasks table
create table if not exists public.housekeeping_tasks (
  id uuid default gen_random_uuid() primary key,
  unit_id uuid references public.units(id) on delete cascade not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text default 'pending', -- pending, completed
  priority text default 'normal', -- normal, high
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- RLS Policies for housekeeping_tasks
alter table public.housekeeping_tasks enable row level security;

create policy "Enable read access for authenticated users" on public.housekeeping_tasks
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.housekeeping_tasks
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.housekeeping_tasks
  for update using (auth.role() = 'authenticated');

-- Function to handle checkout automation
create or replace function public.handle_booking_checkout()
returns trigger as $$
begin
  if new.status = 'checked_out' and old.status != 'checked_out' then
    -- 1. Mark unit as dirty
    update public.units
    set status = 'dirty'
    where id = new.unit_id;

    -- 2. Create housekeeping task
    insert into public.housekeeping_tasks (unit_id, priority, status)
    values (new.unit_id, 'high', 'pending');
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for checkout automation
drop trigger if exists on_booking_checkout on public.bookings;
create trigger on_booking_checkout
  after update on public.bookings
  for each row
  execute procedure public.handle_booking_checkout();
