/**
 * TypeScript types auto-generated from Supabase schema.
 * In production, generate these with: npx supabase gen types typescript --linked
 * This file is manually maintained until the database is fully seeded.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      stations: {
        Row: {
          id: string;
          station_code: string;
          station_name: string;
          city: string | null;
          state: string | null;
          latitude: number | null;
          longitude: number | null;
          zone: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stations']['Row'], 'id' | 'created_at' | 'is_active'> & {
          id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stations']['Insert']>;
      };
      trains: {
        Row: {
          id: string;
          train_number: string;
          train_name: string;
          train_type: string | null;
          source_station: string | null;
          destination_station: string | null;
          runs_on: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trains']['Row'], 'id' | 'created_at' | 'is_active'> & {
          id?: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['trains']['Insert']>;
      };
      train_stops: {
        Row: {
          id: string;
          train_id: string;
          station_id: string;
          stop_sequence: number;
          arrival_time: string | null;
          departure_time: string | null;
          halt_minutes: number | null;
          distance_km: number | null;
        };
        Insert: Omit<Database['public']['Tables']['train_stops']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['train_stops']['Insert']>;
      };
      availability_snapshots: {
        Row: {
          id: string;
          train_id: string | null;
          from_station: string | null;
          to_station: string | null;
          journey_date: string;
          class_code: string;
          quota: string;
          status: string;
          waitlist_number: number | null;
          rac_number: number | null;
          available_count: number | null;
          fare: number | null;
          captured_at: string;
          source: string | null;
        };
        Insert: Omit<Database['public']['Tables']['availability_snapshots']['Row'], 'id' | 'captured_at'> & {
          id?: string;
          captured_at?: string;
        };
        Update: Partial<Database['public']['Tables']['availability_snapshots']['Insert']>;
      };
      historical_outcomes: {
        Row: {
          id: string;
          train_id: string | null;
          from_station: string | null;
          to_station: string | null;
          journey_date: string;
          class_code: string;
          quota: string;
          initial_status: string;
          initial_waitlist: number | null;
          final_status: string;
          final_waitlist: number | null;
          final_captured_at: string | null;
          data_source: string | null;
        };
        Insert: Omit<Database['public']['Tables']['historical_outcomes']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['historical_outcomes']['Insert']>;
      };
      predictions: {
        Row: {
          id: string;
          train_id: string | null;
          journey_date: string;
          from_station: string | null;
          to_station: string | null;
          class_code: string;
          quota: string;
          predicted_probability: number;
          confidence: string | null;
          model_version: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['predictions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['predictions']['Insert']>;
      };
      saved_trips: {
        Row: {
          id: string;
          user_id: string;
          from_station: string | null;
          to_station: string | null;
          journey_date: string;
          passengers: number;
          class_code: string | null;
          quota: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saved_trips']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['saved_trips']['Insert']>;
      };
      data_sources: {
        Row: {
          id: string;
          name: string;
          type: string | null;
          license: string | null;
          status: string | null;
          last_sync: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['data_sources']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['data_sources']['Insert']>;
      };
      model_versions: {
        Row: {
          id: string;
          version: string;
          algorithm: string;
          training_dataset_version: string | null;
          metrics: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['model_versions']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['model_versions']['Insert']>;
      };
      collection_watchlist: {
        Row: {
          id: string;
          train_id: string;
          from_station: string;
          to_station: string;
          journey_date: string;
          class_code: string;
          quota: string;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collection_watchlist']['Row'], 'id' | 'created_at' | 'active'> & { id?: string; created_at?: string; active?: boolean };
        Update: Partial<Database['public']['Tables']['collection_watchlist']['Insert']>;
      };
      collection_logs: {
        Row: {
          id: string;
          watchlist_id: string;
          status: string;
          error_message: string | null;
          captured_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collection_logs']['Row'], 'id' | 'captured_at' | 'error_message'> & { id?: string; captured_at?: string; error_message?: string };
        Update: Partial<Database['public']['Tables']['collection_logs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
