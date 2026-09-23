CREATE TABLE collection_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
    from_station UUID REFERENCES stations(id),
    to_station UUID REFERENCES stations(id),
    journey_date DATE NOT NULL,
    class_code TEXT NOT NULL,
    quota TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE collection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES collection_watchlist(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'SUCCESS' or 'FAILURE'
    error_message TEXT,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
