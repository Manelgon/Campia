-- Add is_active column to profiles for user activation/deactivation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Add comment
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active and can log in';
