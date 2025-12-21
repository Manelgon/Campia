-- Add 'contestacion' column to guests table
alter table public.guests
add column if not exists contestacion boolean default true;

comment on column public.guests.contestacion is 'Indicates if the guest has replied or provided an answer (exact meaning depends on app logic)';
