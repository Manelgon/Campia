-- Add property_id to invoices for direct property isolation
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Backfill property_id from bookings
UPDATE public.invoices i
SET property_id = b.property_id
FROM public.bookings b
WHERE i.booking_id = b.id AND i.property_id IS NULL;

-- Make property_id NOT NULL after backfilling
ALTER TABLE public.invoices 
ALTER COLUMN property_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON public.invoices(property_id);

-- Do the same for payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Backfill property_id from invoices
UPDATE public.payments p
SET property_id = i.property_id
FROM public.invoices i
WHERE p.invoice_id = i.id AND p.property_id IS NULL;

-- Make property_id NOT NULL after backfilling
ALTER TABLE public.payments 
ALTER COLUMN property_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON public.payments(property_id);
