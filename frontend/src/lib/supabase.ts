import { createBrowserClient } from '@supabase/ssr'

// Types for database tables
export interface Profile {
  id: string
  email: string
  role: 'admin' | 'operations'
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  name: string
  slug: string
  description: string | null
  company_name: string
  logo_url: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  starts_at: string | null
  ends_at: string | null
}

export interface EventTheme {
  id: string
  event_id: string
  primary_color: string
  secondary_color: string
  accent_color: string | null
  background_gradient_start: string | null
  background_gradient_end: string | null
  font_family: string | null
  created_at: string
  updated_at: string
}

export interface EventPrompt {
  id: string
  event_id: string
  option_key: string
  title: string
  prompt_text: string
  reference_image_url: string | null
  preview_image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GeneratedImage {
  id: string
  event_id: string
  prompt_id: string | null
  original_image_url: string | null
  generated_image_url: string
  qr_code_url: string | null
  model_used: string
  tokens_used: number | null
  estimated_cost: number | null
  processing_time_ms: number | null
  created_at: string
}

export interface EventWithDetails extends Event {
  theme: EventTheme | null
  prompts: EventPrompt[]
}

// Create Supabase client for browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton pattern for client-side usage
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}
