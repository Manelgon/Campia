-- Migration to standardize housekeeping priorities with maintenance
-- Rename 'normal' to 'medium'
UPDATE public.housekeeping_tasks
SET priority = 'medium'
WHERE priority = 'normal';

-- Update the handle_booking_checkout trigger if it uses 'normal' (it used 'high', so it's fine, but good to check context)
-- Just ensuring previous migration didn't hardcode 'normal' anywhere else.
