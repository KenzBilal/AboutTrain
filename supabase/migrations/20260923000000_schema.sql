-- 001_schema.sql
-- Database schema for AboutTrain

CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_code TEXT UNIQUE NOT NULL,
    station_name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    zone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE trains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_number TEXT UNIQUE NOT NULL,
    train_name TEXT NOT NULL,
    train_type TEXT,
    source_station UUID REFERENCES stations(id),
    destination_station UUID REFERENCES stations(id),
    runs_on TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE train_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
    station_id UUID REFERENCES stations(id),
    stop_sequence INTEGER NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    halt_minutes INTEGER,
    distance_km DOUBLE PRECISION
);

CREATE TABLE availability_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID REFERENCES trains(id),
    from_station UUID REFERENCES stations(id),
    to_station UUID REFERENCES stations(id),
    journey_date DATE NOT NULL,
    class_code TEXT NOT NULL,
    quota TEXT NOT NULL,
    status TEXT NOT NULL,
    waitlist_number INTEGER,
    rac_number INTEGER,
    available_count INTEGER,
    fare NUMERIC,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    source TEXT
);

CREATE TABLE historical_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID REFERENCES trains(id),
    from_station UUID REFERENCES stations(id),
    to_station UUID REFERENCES stations(id),
    journey_date DATE NOT NULL,
    class_code TEXT NOT NULL,
    quota TEXT NOT NULL,
    initial_status TEXT NOT NULL,
    initial_waitlist INTEGER,
    final_status TEXT NOT NULL,
    final_waitlist INTEGER,
    final_captured_at TIMESTAMP WITH TIME ZONE,
    data_source TEXT
);

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID REFERENCES trains(id),
    journey_date DATE NOT NULL,
    from_station UUID REFERENCES stations(id),
    to_station UUID REFERENCES stations(id),
    class_code TEXT NOT NULL,
    quota TEXT NOT NULL,
    predicted_probability DOUBLE PRECISION NOT NULL,
    confidence TEXT,
    model_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE saved_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id) in Supabase
    from_station UUID REFERENCES stations(id),
    to_station UUID REFERENCES stations(id),
    journey_date DATE NOT NULL,
    passengers INTEGER DEFAULT 1,
    class_code TEXT,
    quota TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    license TEXT,
    status TEXT,
    last_sync TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT UNIQUE NOT NULL,
    algorithm TEXT NOT NULL,
    training_dataset_version TEXT,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX idx_stations_code ON stations(station_code);
CREATE INDEX idx_trains_number ON trains(train_number);
CREATE INDEX idx_train_stops_train_id ON train_stops(train_id);
CREATE INDEX idx_avail_train_date ON availability_snapshots(train_id, journey_date);
CREATE INDEX idx_hist_train_date ON historical_outcomes(train_id, journey_date);
CREATE INDEX idx_saved_trips_user ON saved_trips(user_id);
