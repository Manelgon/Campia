-- Add assigned_to column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- Enable RLS for updates on assigned_to (assuming RLS is enabled)
-- Policies typically allow update if user has property access. 
-- We ensure the update policy covers this column.

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
