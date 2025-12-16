-- Migration to rename housekeeping statuses to match tickets
-- 1. Rename 'completed' to 'resolved'
UPDATE public.housekeeping_tasks
SET status = 'resolved'
WHERE status = 'completed';

-- 2. Rename 'pending' to 'open'
UPDATE public.housekeeping_tasks
SET status = 'open'
WHERE status = 'pending';

-- 3. Update the trigger function to use 'open' instead of 'pending'
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
    values (new.unit_id, 'high', 'open');
  end if;
  return new;
end;
$$ language plpgsql security definer;
