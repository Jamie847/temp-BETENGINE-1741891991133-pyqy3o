export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      betting_odds: {
        Row: {
          id: string
          match_id: string | null
          home_odds: number | null
          away_odds: number | null
          over_under: number | null
          line_movements: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          match_id?: string | null
          home_odds?: number | null
          away_odds?: number | null
          over_under?: number | null
          line_movements?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string | null
          home_odds?: number | null
          away_odds?: number | null
          over_under?: number | null
          line_movements?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      historical_data: {
        Row: {
          id: string
          team_id: string | null
          match_id: string | null
          performance_metrics: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          match_id?: string | null
          performance_metrics?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string | null
          match_id?: string | null
          performance_metrics?: Json | null
          created_at?: string | null
        }
      }
      matches: {
        Row: {
          id: string
          sport: string
          home_team_id: string | null
          away_team_id: string | null
          start_time: string
          venue_name: string | null
          venue_city: string | null
          venue_state: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          home_score: number | null
          away_score: number | null
          result_data: Json | null
        }
        Insert: {
          id?: string
          sport: string
          home_team_id?: string | null
          away_team_id?: string | null
          start_time: string
          venue_name?: string | null
          venue_city?: string | null
          venue_state?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          home_score?: number | null
          away_score?: number | null
          result_data?: Json | null
        }
        Update: {
          id?: string
          sport?: string
          home_team_id?: string | null
          away_team_id?: string | null
          start_time?: string
          venue_name?: string | null
          venue_city?: string | null
          venue_state?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          home_score?: number | null
          away_score?: number | null
          result_data?: Json | null
        }
      }
      predictions: {
        Row: {
          id: string
          match_id: string | null
          home_win_probability: number
          away_win_probability: number
          confidence_score: number
          factors: Json | null
          outcome: boolean | null
          created_at: string | null
          resolved_at: string | null
          actual_outcome: boolean | null
          prediction_type: string | null
          profit_loss: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          match_id?: string | null
          home_win_probability: number
          away_win_probability: number
          confidence_score: number
          factors?: Json | null
          outcome?: boolean | null
          created_at?: string | null
          resolved_at?: string | null
          actual_outcome?: boolean | null
          prediction_type?: string | null
          profit_loss?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          match_id?: string | null
          home_win_probability?: number
          away_win_probability?: number
          confidence_score?: number
          factors?: Json | null
          outcome?: boolean | null
          created_at?: string | null
          resolved_at?: string | null
          actual_outcome?: boolean | null
          prediction_type?: string | null
          profit_loss?: number | null
          notes?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          sport: string
          logo_url: string | null
          record: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          sport: string
          logo_url?: string | null
          record?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          sport?: string
          logo_url?: string | null
          record?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      weather_data: {
        Row: {
          id: string
          match_id: string | null
          temperature: number | null
          condition: string | null
          wind_speed: number | null
          precipitation: number | null
          humidity: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          match_id?: string | null
          temperature?: number | null
          condition?: string | null
          wind_speed?: number | null
          precipitation?: number | null
          humidity?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string | null
          temperature?: number | null
          condition?: string | null
          wind_speed?: number | null
          precipitation?: number | null
          humidity?: number | null
          created_at?: string | null
        }
      }
    }
    Views: {
      prediction_performance: {
        Row: {
          prediction_type: string | null
          total_predictions: number | null
          resolved_predictions: number | null
          correct_predictions: number | null
          avg_confidence: number | null
          win_percentage: number | null
          profit_loss: number | null
        }
        Insert: {
          prediction_type?: string | null
          total_predictions?: number | null
          resolved_predictions?: number | null
          correct_predictions?: number | null
          avg_confidence?: number | null
          win_percentage?: number | null
          profit_loss?: number | null
        }
        Update: {
          prediction_type?: string | null
          total_predictions?: number | null
          resolved_predictions?: number | null
          correct_predictions?: number | null
          avg_confidence?: number | null
          win_percentage?: number | null
          profit_loss?: number | null
        }
      }
    }
  }
}