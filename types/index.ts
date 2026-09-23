export interface Station {
  id: string;
  station_code: string;
  station_name: string;
  city: string;
  state: string;
  zone: string;
}

export interface Train {
  id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  source_station: string;
  destination_station: string;
  runs_on: string;
}

export interface AvailabilitySnapshot {
  id: string;
  train_id: string;
  from_station: string;
  to_station: string;
  journey_date: string;
  class_code: string;
  quota: string;
  status: 'CNF' | 'RAC' | 'WL' | 'AVAILABLE' | 'REGRET';
  waitlist_number?: number;
  rac_number?: number;
  available_count?: number;
  fare: number;
  captured_at: string;
  source: string; // E.g. 'Live API', 'Mock', 'Supabase Cache'
}

export interface Prediction {
  id?: string;
  train_id: string;
  journey_date: string;
  class_code: string;
  quota: string;
  predicted_probability: number; // 0 to 100
  confidence: 'High' | 'Medium' | 'Low';
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  label: string;
  impact: 'Positive' | 'Neutral' | 'Negative';
  description: string;
}

export interface CollectionWatchlist {
  id: string;
  train_id: string;
  from_station: string;
  to_station: string;
  journey_date: string;
  class_code: string;
  quota: string;
  active: boolean;
  created_at: string;
}

export interface CollectionLog {
  id: string;
  watchlist_id: string;
  status: 'SUCCESS' | 'FAILURE';
  error_message?: string;
  captured_at: string;
}

export interface JourneyQuery {
  from: string; // station code
  to: string;   // station code
  date: string; // YYYY-MM-DD
  passengers: number;
  classCode: string;
  quota: string;
}

export interface TrainResult {
  train: Train;
  fromStation: Station;
  toStation: Station;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availability?: AvailabilitySnapshot;
  prediction?: Prediction;
}
