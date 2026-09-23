-- Migration: Enable Row Level Security
-- All tables must have RLS enabled before any real credentials are set.
-- Service-role key bypasses RLS — never expose it to the browser.

-- ─── ENABLE RLS ON ALL TABLES ────────────────────────────────────────────────

ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── PUBLIC READ POLICIES ─────────────────────────────────────────────────────
-- Reference data (stations, trains, stops) is publicly readable.
-- Availability snapshots and predictions are publicly readable.
-- This data is not sensitive — it mirrors publicly available railway data.

CREATE POLICY "public_read_stations"
  ON stations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "public_read_trains"
  ON trains FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "public_read_train_stops"
  ON train_stops FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_availability"
  ON availability_snapshots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_historical_outcomes"
  ON historical_outcomes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_predictions"
  ON predictions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_model_versions"
  ON model_versions FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── SAVED TRIPS: USER-SCOPED ─────────────────────────────────────────────────
-- Users can only read and write their own saved trips.

CREATE POLICY "user_read_own_saved_trips"
  ON saved_trips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_insert_own_saved_trips"
  ON saved_trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_delete_own_saved_trips"
  ON saved_trips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- No anonymous access to saved trips (requires login)

-- ─── WRITE RESTRICTED TO SERVICE ROLE ────────────────────────────────────────
-- Data ingestion (availability, historical outcomes, predictions) is done
-- via service-role key on the server. Anon/authenticated users cannot write.

-- stations: service-role only (no policy for anon insert)
-- trains: service-role only
-- availability_snapshots: service-role only
-- historical_outcomes: service-role only
-- predictions: service-role only

-- ─── AUDIT LOGS: INSERT ONLY FOR AUTHENTICATED ────────────────────────────────
CREATE POLICY "authenticated_insert_audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL);

CREATE POLICY "admin_read_audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL); -- refine to role check in production

-- ─── DATA SOURCES: PUBLIC READ ────────────────────────────────────────────────
CREATE POLICY "public_read_data_sources"
  ON data_sources FOR SELECT
  TO anon, authenticated
  USING (true);
