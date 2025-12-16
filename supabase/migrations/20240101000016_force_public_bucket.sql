-- Force the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'maintenance-uploads';

-- Verify policies are permissive enough (redundant but safe)
-- Ensure 'authenticated' role has usage on the schema storage (usually enabled by default but good to check permissions if custom roles involved)
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;

-- Ensure public access policy definitely exists (re-run safely)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Maintenance Uploads Public Read'
    ) THEN
        CREATE POLICY "Maintenance Uploads Public Read"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'maintenance-uploads' );
    END IF;
END
$$;
