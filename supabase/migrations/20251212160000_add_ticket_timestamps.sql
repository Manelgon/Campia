-- Add timestamps for KPI tracking
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;

-- Create indexes for performance on reporting queries
CREATE INDEX IF NOT EXISTS idx_tickets_started_at ON public.tickets(started_at);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON public.tickets(status, created_at);

-- Add comment
COMMENT ON COLUMN public.tickets.started_at IS 'Timestamp when the ticket status moved to in_progress';
COMMENT ON COLUMN public.tickets.resolved_at IS 'Timestamp when the ticket status moved to resolved';
