-- Create activity_logs table
create table if not exists public.activity_logs (
    id uuid default gen_random_uuid() primary key,
    property_id uuid references public.properties(id) not null,
    user_id uuid references auth.users(id), -- User who performed the action
    type text not null, -- e.g. 'check-in', 'payment', 'booking-created'
    description text not null,
    entity_id uuid, -- ID of the related object (booking_id, invoice_id, etc.)
    metadata jsonb default '{}'::jsonb, -- Extra info
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.activity_logs enable row level security;

create policy "Users can view logs of their property" on public.activity_logs
    for select
    using (
        property_id in (
            select property_id from public.profiles where id = auth.uid()
        )
    );

create policy "Users can insert logs for their property" on public.activity_logs
    for insert
    with check (
        property_id in (
            select property_id from public.profiles where id = auth.uid()
        )
    );

-- Enable Realtime
-- Note: 'supabase_realtime' publication usually exists. We add the table to it.
alter publication supabase_realtime add table public.activity_logs;
