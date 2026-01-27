// Supabase Database Types
// This file should be generated using Supabase CLI: supabase gen types typescript --project-id <project-id> > database.types.ts
// For now, providing a basic type structure

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
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      community_post_list_view: {
        Row: {
          author_avatar?: string | null
          [key: string]: unknown
        }
      }
      product_overview_view: {
        Row: Record<string, unknown>
      }
      community_post_detail: {
        Row: Record<string, unknown>
      }
      gpt_ideas_view: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [key: string]: string
    }
  }
}
