-- Insert a test property
insert into public.properties (id, name, address, settings)
values 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Camping Paraíso', 'Carretera de la Playa, km 4, Costa Brava', '{"tax_rate": 0.21, "currency": "EUR"}'::jsonb);

-- Insert some units for the property
insert into public.units (property_id, name, type, capacity, price_per_night, status)
values
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Parcela 101', 'parcela', 6, 25.00, 'occupied'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Parcela 102', 'parcela', 6, 25.00, 'clean'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bungalow A1', 'bungalow', 4, 120.00, 'dirty'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bungalow A2', 'bungalow', 4, 120.00, 'clean');

-- Insert a test guest
insert into public.guests (id, full_name, email, phone, document_id, nationality)
values
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Juan Pérez', 'juan.perez@example.com', '+34600123456', '12345678A', 'Española');

-- Insert a test booking
insert into public.bookings (property_id, unit_id, guest_id, check_in_date, check_out_date, status, total_amount, guests_count)
values
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', (select id from public.units where name = 'Parcela 101'), 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', CURRENT_DATE, CURRENT_DATE + 3, 'checked_in', 75.00, 2);

-- Seed Extras (Moved from financials migration)
insert into public.extras (property_id, name, price, type)
values 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Breakfast', 15.00, 'service'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Late Check-out', 30.00, 'service'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bike Rental', 20.00, 'service'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Parking', 10.00, 'service');
