-- Assign a default property to any profile that doesn't have one
-- This fixes the RLS visibility issue where users couldn't see bookings

do $$
declare
  v_property_id uuid;
begin
  -- Get the first property (usually the one created in seed)
  select id into v_property_id from public.properties limit 1;

  if v_property_id is not null then
    -- Update all profiles with null property_id
    update public.profiles 
    set property_id = v_property_id 
    where property_id is null;
    
    -- Also ensure bookings have this property if they are null (just in case)
    update public.bookings
    set property_id = v_property_id
    where property_id is null;
  end if;
end $$;
