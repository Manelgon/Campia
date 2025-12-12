-- Add contact info columns to properties table
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'properties' and column_name = 'phone') then
        alter table public.properties add column phone text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'properties' and column_name = 'email') then
        alter table public.properties add column email text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'properties' and column_name = 'website_url') then
        alter table public.properties add column website_url text;
    end if;
end $$;
