-- seed.sql for AboutTrain

-- Insert Stations
INSERT INTO stations (id, station_code, station_name, city, state, zone)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'PGW', 'Phagwara Junction', 'Phagwara', 'Punjab', 'NR'),
    ('22222222-2222-2222-2222-222222222222', 'BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra', 'WR'),
    ('33333333-3333-3333-3333-333333333333', 'NDLS', 'New Delhi', 'New Delhi', 'Delhi', 'NR'),
    ('44444444-4444-4444-4444-444444444444', 'LDH', 'Ludhiana Junction', 'Ludhiana', 'Punjab', 'NR')
ON CONFLICT (station_code) DO NOTHING;

-- Insert Trains
INSERT INTO trains (id, train_number, train_name, train_type, source_station, destination_station, runs_on)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12926', 'Paschim Express', 'Superfast', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Daily'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '12904', 'Golden Temple Mail', 'Superfast', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Daily')
ON CONFLICT (train_number) DO NOTHING;

-- Insert Train Stops
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, halt_minutes, distance_km)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1, '09:00:00', '09:12:00', 12, 0),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 2, '09:50:00', '10:00:00', 10, 36),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 3, '16:00:00', '16:15:00', 15, 360),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 4, '14:35:00', '14:35:00', 0, 1720);

-- Insert Availability Snapshots (Mock data)
INSERT INTO availability_snapshots (train_id, from_station, to_station, journey_date, class_code, quota, status, waitlist_number, rac_number, available_count, fare, source)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-10-18', '3A', 'GN', 'WL', 18, NULL, 0, 1850, 'Mock'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-10-18', '3A', 'GN', 'RAC', NULL, 12, 0, 1920, 'Mock');

-- Insert Historical Outcomes (Mock data for predictions)
INSERT INTO historical_outcomes (train_id, from_station, to_station, journey_date, class_code, quota, initial_status, initial_waitlist, final_status, final_waitlist, data_source)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2025-10-18', '3A', 'GN', 'WL', 20, 'CNF', NULL, 'Mock'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2025-10-19', '3A', 'GN', 'WL', 25, 'CNF', NULL, 'Mock'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2025-10-20', '3A', 'GN', 'WL', 40, 'WL', 5, 'Mock');
