-- Add property_id to housekeeping_tasks for multi-property isolation
ALTER TABLE public.housekeeping_tasks 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_property_id ON public.housekeeping_tasks(property_id);

-- Update existing tasks to get property_id from their unit
UPDATE public.housekeeping_tasks ht
SET property_id = u.property_id
FROM public.units u
WHERE ht.unit_id = u.id AND ht.property_id IS NULL;

-- Make property_id NOT NULL after backfilling
ALTER TABLE public.housekeeping_tasks 
ALTER COLUMN property_id SET NOT NULL;
