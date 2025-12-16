-- Ensure Bucket Exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-uploads', 'maintenance-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop potentially conflicting generic policies if they exist on storage.objects
-- (We use the specific name we tried to create, or generic ones if we suspect them)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;

-- Create Specific Policies for Maintenance Uploads

-- 1. Public Read Access
CREATE POLICY "Maintenance Uploads Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'maintenance-uploads' );

-- 2. Authenticated Upload (Guests and Staff)
CREATE POLICY "Maintenance Uploads Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'maintenance-uploads' );

-- 3. Authenticated Update (Optional)
CREATE POLICY "Maintenance Uploads Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'maintenance-uploads' );
