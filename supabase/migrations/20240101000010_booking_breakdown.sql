
create or replace function public.get_booking_breakdown(
    p_unit_id uuid,
    p_check_in date,
    p_check_out date
)
returns table (
    date date,
    price numeric,
    source text -- 'base', 'custom_unit', 'custom_type'
)
language plpgsql
security definer
as $$
declare
    v_date date;
    v_unit_type text;
    v_base_price numeric;
    v_daily_price numeric;
    v_custom_price_unit numeric;
    v_custom_price_type numeric;
    v_source text;
begin
    -- 1. Get Unit Details
    select type, price_per_night into v_unit_type, v_base_price
    from public.units
    where id = p_unit_id;

    if not found then
        -- Return empty if unit not found
        return;
    end if;

    -- 2. Loop through each night
    v_date := p_check_in;
    
    while v_date < p_check_out loop
        v_daily_price := v_base_price;
        v_source := 'Tarifa Base';

        -- Check for custom price for THIS unit
        select price into v_custom_price_unit
        from public.custom_prices
        where unit_id = p_unit_id
          and v_date between start_date and end_date
        order by created_at desc 
        limit 1;

        if v_custom_price_unit is not null then
            v_daily_price := v_custom_price_unit;
            v_source := 'Tarifa Especial (Unidad)';
        else
            -- Check for custom price for this TYPE
            select price into v_custom_price_type
            from public.custom_prices
            where unit_type = v_unit_type
              and unit_id is null
              and v_date between start_date and end_date
            order by created_at desc
            limit 1;

            if v_custom_price_type is not null then
                v_daily_price := v_custom_price_type;
                v_source := 'Tarifa Especial (Tipo)';
            end if;
        end if;

        -- Return row
        date := v_date;
        price := v_daily_price;
        source := v_source;
        return next;

        -- Next day
        v_date := v_date + 1;
    end loop;
end;
$$;
