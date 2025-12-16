-- Add created_by column to housekeeping_tasks
ALTER TABLE public.housekeeping_tasks 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Drop existing view to recreate with new column join
DROP VIEW IF EXISTS public.view_housekeeping_details;

-- Recreate view with created_by join
CREATE OR REPLACE VIEW public.view_housekeeping_details AS
SELECT
    ht.*,
    u.name as unit_name,
    p_assigned.full_name as assigned_to_name,
    p_created.full_name as reporter_name,
    p_created.role as reporter_role,
    p_created.email as reporter_email
FROM
    public.housekeeping_tasks ht
LEFT JOIN
    public.units u ON ht.unit_id = u.id
LEFT JOIN
    public.profiles p_assigned ON ht.assigned_to = p_assigned.id
LEFT JOIN
    public.profiles p_created ON ht.created_by = p_created.id;

-- Grant permissions again just in case
GRANT SELECT ON public.view_housekeeping_details TO authenticated;image.png
