-- Add photos column to tickets
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT ARRAY[]::text[];

-- Add photos column to housekeeping_tasks
ALTER TABLE public.housekeeping_tasks 
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT ARRAY[]::text[];

-- Create storage bucket for maintenance uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-uploads', 'maintenance-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for maintenance-uploads

-- 1. Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'maintenance-uploads' );

-- 2. Authenticated Upload (Guests and Staff)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'maintenance-uploads' );

-- 3. Authenticated Update (Optional, if needed)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'maintenance-uploads' );
