-- 1. Create Custom Prices Table
create table if not exists public.custom_prices (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) not null,
  unit_id uuid references public.units(id) on delete cascade, -- For specific unit override
  unit_type text, -- For type-wide override (e.g., 'bungalow') matching units.type
  start_date date not null,
  end_date date not null,
  price numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Validation: Must have either unit_id OR unit_type (or both, though specific unit usually takes precedence)
  constraint check_target_defined check (unit_id is not null or unit_type is not null),
  -- Validation: Start date before or equal end date
  constraint check_dates_order check (start_date <= end_date)
);

-- 2. Enable RLS
alter table public.custom_prices enable row level security;

create policy "Enable all for authenticated users" on public.custom_prices
    for all to authenticated using (true); -- Simplified for MVP, ideally filter by property_id

-- 3. Function to Calculate Booking Total
-- This function calculates the total price for a stay based on:
-- 1. Custom price for the specific unit on that day
-- 2. Custom price for the unit type on that day
-- 3. Base price of the unit
create or replace function public.calculate_booking_total(
    p_unit_id uuid,
    p_check_in date,
    p_check_out date
)
returns numeric
language plpgsql
security definer
as $$
declare
    v_total numeric := 0;
    v_date date;
    v_unit_type text;
    v_base_price numeric;
    v_daily_price numeric;
    v_custom_price_unit numeric;
    v_custom_price_type numeric;
begin
    -- 1. Get Unit Details (Base Price and Type)
    select type, price_per_night into v_unit_type, v_base_price
    from public.units
    where id = p_unit_id;

    if not found then
        raise exception 'Unit not found: %', p_unit_id;
    end if;

    -- 2. Loop through each night of the stay
    -- Note: We loop from check_in up to (check_out - 1 day) because you don't pay for the checkout day night
    v_date := p_check_in;
    
    while v_date < p_check_out loop
        v_daily_price := v_base_price; -- Default to base

        -- Check for custom price for THIS unit
        select price into v_custom_price_unit
        from public.custom_prices
        where unit_id = p_unit_id
          and v_date between start_date and end_date
        order by created_at desc -- Take most recently created if multiple overlap (though overlaps should be prevented)
        limit 1;

        if v_custom_price_unit is not null then
            v_daily_price := v_custom_price_unit;
        else
            -- Check for custom price for this TYPE
            select price into v_custom_price_type
            from public.custom_prices
            where unit_type = v_unit_type
              and unit_id is null -- Only purely type-based rules
              and v_date between start_date and end_date
            order by created_at desc
            limit 1;

            if v_custom_price_type is not null then
                v_daily_price := v_custom_price_type;
            end if;
        end if;

        -- Add to total
        v_total := v_total + v_daily_price;

        -- Next day
        v_date := v_date + 1;
    end loop;

    return v_total;
end;
$$;
