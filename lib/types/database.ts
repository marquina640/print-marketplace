export type UserRole = 'client' | 'printer_owner' | 'admin'
export type JobStatus = 'open' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type QuoteStatus = 'pending' | 'accepted' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          role: UserRole | null
          display_name: string | null
          email: string
          avatar_url: string | null
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: UserRole | null
          display_name?: string | null
          email: string
          avatar_url?: string | null
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: UserRole | null
          display_name?: string | null
          avatar_url?: string | null
          onboarding_complete?: boolean
        }
      }
      printer_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          city: string
          location: string | null
          service_radius_km: number
          num_printers: number
          printer_models: string[]
          materials: string[]
          colors: string[]
          design_services: boolean
          shipping: boolean
          local_delivery: boolean
          pickup: boolean
          hourly_rate: number | null
          price_per_gram: number | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          city: string
          location?: string | null
          service_radius_km?: number
          num_printers?: number
          printer_models?: string[]
          materials?: string[]
          colors?: string[]
          design_services?: boolean
          shipping?: boolean
          local_delivery?: boolean
          pickup?: boolean
          hourly_rate?: number | null
          price_per_gram?: number | null
          description?: string | null
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['printer_profiles']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          client_id: string
          title: string
          description: string
          material: string
          color: string | null
          quantity: number
          deadline: string | null
          budget: number | null
          location: string | null
          shipping_required: boolean
          status: JobStatus
          accepted_quote_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          description: string
          material: string
          color?: string | null
          quantity?: number
          deadline?: string | null
          budget?: number | null
          location?: string | null
          shipping_required?: boolean
          status?: JobStatus
          accepted_quote_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
      job_files: {
        Row: {
          id: string
          job_id: string
          uploaded_by: string | null
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          uploaded_by?: string | null
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
        }
        Update: Partial<Database['public']['Tables']['job_files']['Insert']>
      }
      quotes: {
        Row: {
          id: string
          job_id: string
          printer_id: string
          price: number
          lead_time_days: number
          message: string | null
          status: QuoteStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          printer_id: string
          price: number
          lead_time_days: number
          message?: string | null
          status?: QuoteStatus
        }
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }
      messages: {
        Row: {
          id: string
          job_id: string
          sender_id: string
          receiver_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          sender_id: string
          receiver_id: string
          content: string
          read_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          job_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          value: unknown
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: unknown
          description?: string | null
        }
        Update: Partial<Database['public']['Tables']['platform_settings']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
