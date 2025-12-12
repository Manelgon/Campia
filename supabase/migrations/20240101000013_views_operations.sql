-- View for Maintenance Tickets
CREATE OR REPLACE VIEW public.view_tickets_details AS
SELECT
    t.*,
    u.name as unit_name,
    p_assigned.full_name as assigned_to_name,
    p_reported.full_name as reported_by_name
FROM
    public.tickets t
LEFT JOIN
    public.units u ON t.unit_id = u.id
LEFT JOIN
    public.profiles p_assigned ON t.assigned_to = p_assigned.id
LEFT JOIN
    public.profiles p_reported ON t.reported_by = p_reported.id;

-- View for Housekeeping Tasks
CREATE OR REPLACE VIEW public.view_housekeeping_details AS
SELECT
    ht.*,
    u.name as unit_name,
    p_assigned.full_name as assigned_to_name
FROM
    public.housekeeping_tasks ht
LEFT JOIN
    public.units u ON ht.unit_id = u.id
LEFT JOIN
    public.profiles p_assigned ON ht.assigned_to = p_assigned.id;

-- Grant permissions
GRANT SELECT ON public.view_tickets_details TO authenticated;
GRANT SELECT ON public.view_housekeeping_details TO authenticated;
