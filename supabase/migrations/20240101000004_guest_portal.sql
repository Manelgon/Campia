-- 1. Add 'guest' to user_role enum
-- Postgres doesn't allow 'IF NOT EXISTS' easily on enum values in a single line, so we wrap it.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'user_role' AND enumlabel = 'guest') THEN
    ALTER TYPE user_role ADD VALUE 'guest';
  END IF;
END$$;

-- 2. Link Guests table to Auth Users
-- This allows us to find the 'guest record' associated with the currently logged-in auth user.
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id);

-- 3. RLS Policies for Guests (Strict)

-- Guests: Can read their OWN record
CREATE POLICY "Guests read own profile" ON public.guests
  FOR SELECT USING (user_id = auth.uid());

-- Bookings: Can read bookings linked to their Guest ID
-- We need a way to link Auth UID -> Guest ID.
-- Helper function or Join in policy.
-- Policy: booking.guest_id must match the id of the guest record where user_id = auth.uid()

CREATE POLICY "Guests read own bookings" ON public.bookings
  FOR SELECT USING (
    guest_id IN (SELECT id FROM public.guests WHERE user_id = auth.uid())
  );

-- Units: Can read unit if they have a confirmed/checked_in booking for it
CREATE POLICY "Guests read booked unit" ON public.units
  FOR SELECT USING (
    id IN (
        SELECT unit_id FROM public.bookings 
        WHERE guest_id IN (SELECT id FROM public.guests WHERE user_id = auth.uid())
        AND status IN ('confirmed', 'checked_in')
    )
  );

-- Tickets: Guests can CRUD tickets for their own bookings/units
CREATE POLICY "Guests read own tickets" ON public.tickets
  FOR SELECT USING (
    -- Created by them (reported_by) OR linked to their unit/booking (Optional)
    reported_by = auth.uid()
  );

CREATE POLICY "Guests create tickets" ON public.tickets
  FOR INSERT WITH CHECK (
    reported_by = auth.uid()
    -- And optionally check if unit_id is valid for them, but trust for now or handle in app
  );

-- Grant usage on relevant tables if needed (usually public role has it)
