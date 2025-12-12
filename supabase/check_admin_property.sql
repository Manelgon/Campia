-- CHECK: Does the current user have a property assigned?
-- Run this in SQL Editor

-- 1. Check your own profile
SELECT id, email, role, property_id FROM public.profiles WHERE id = auth.uid();

-- 2. If property_id is NULL, you need to assign one.
-- First, list properties:
SELECT id, name FROM public.properties;

-- 3. Update your profile (replace YOUR_ID and PROPERTY_ID)
-- UPDATE public.profiles 
-- SET property_id = 'THE_PROPERTY_UUID' 
-- WHERE id = auth.uid();

-- FIX FOR "SUPER ADMIN" (Optional):
-- If you want admins to see ALL profiles regardless of property:
-- DROP POLICY IF EXISTS "Read same property profiles" ON public.profiles;
-- CREATE POLICY "Read same property profiles" ON public.profiles
-- FOR SELECT USING (
--   property_id = get_auth_property_id() 
--   OR 
--   (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
-- );
