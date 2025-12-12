-- Diagnostic script to check bookings for guest a3395b86-d270-4638-b9bd-215eb849d880

SELECT 
    b.id,
    b.status,
    b.check_in_date,
    b.check_out_date,
    b.guest_id,
    b.property_id,
    u.name as unit_name
FROM 
    bookings b
LEFT JOIN
    units u ON b.unit_id = u.id
WHERE 
    b.guest_id = 'a3395b86-d270-4638-b9bd-215eb849d880';
