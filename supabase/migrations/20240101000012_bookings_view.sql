-- Create a view to flatten bookings with guest and unit details for easier sorting and searching
CREATE OR REPLACE VIEW public.view_bookings_details AS
SELECT
    b.id,
    b.created_at,
    b.check_in_date,
    b.check_out_date,
    b.status,
    b.guests_count,
    b.total_amount,
    b.payment_status,
    b.unit_id,
    u.name as unit_name,
    b.guest_id,
    g.full_name as guest_name,
    g.email as guest_email,
    g.phone as guest_phone,
    b.property_id
FROM
    public.bookings b
LEFT JOIN
    public.units u ON b.unit_id = u.id
LEFT JOIN
    public.guests g ON b.guest_id = g.id;

-- Enable RLS (Views don't have RLS directly, they inherit from tables if security_invoker is true, or we grant access)
-- Best practice for Supabase views generally involves granting select to authenticated role if it's for the dashboard.
GRANT SELECT ON public.view_bookings_details TO authenticated;
