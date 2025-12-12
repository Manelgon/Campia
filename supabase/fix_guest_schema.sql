-- FIX: Add missing columns and types for Guest Portal
-- Run this in your Supabase SQL Editor

-- 1. Ensure 'guest' role exists in the enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'user_role' AND enumlabel = 'guest') THEN
    ALTER TYPE user_role ADD VALUE 'guest';
  END IF;
END$$;

-- 2. Add user_id column to guests table if it doesn't exist
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id);

-- 3. Force Schema Cache Reload (Important for the error you saw)
NOTIFY pgrst, 'reload schema';

-- 4. Verify (Optional, will show output in results)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'guests' AND column_name = 'user_id';
