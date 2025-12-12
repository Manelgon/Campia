-- FIX: Assign First Property to Current User (if missing)
-- Run this in SQL Editor

DO $$
DECLARE
  v_property_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  -- Get the first property found in the system
  SELECT id INTO v_property_id FROM public.properties LIMIT 1;

  IF v_property_id IS NOT NULL THEN
    -- Update the current user's profile
    UPDATE public.profiles
    SET property_id = v_property_id
    WHERE id = v_user_id AND property_id IS NULL;
    
    RAISE NOTICE 'Assigned Property % to User %', v_property_id, v_user_id;
  ELSE
    RAISE NOTICE 'No properties found in system.';
  END IF;
END$$;

-- Verify
SELECT id, email, role, property_id FROM public.profiles WHERE id = auth.uid();
