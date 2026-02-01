import { getSupabase, Event, EventWithDetails, EventTheme, EventPrompt } from './supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// =====================================================
// Event API Functions
// =====================================================

export async function fetchEvents(activeOnly = false): Promise<Event[]> {
  const supabase = getSupabase()
  
  let query = supabase.from('events').select('*')
  
  if (activeOnly) {
    query = query.eq('is_active', true)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function fetchEventBySlug(slug: string): Promise<EventWithDetails | null> {
  const supabase = getSupabase()
  
  // Get event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (eventError || !event) return null
  
  // Get theme
  const { data: theme } = await supabase
    .from('event_themes')
    .select('*')
    .eq('event_id', event.id)
    .single()
  
  // Get prompts
  const { data: prompts } = await supabase
    .from('event_prompts')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .order('display_order')
  
  return {
    ...event,
    theme: theme || null,
    prompts: prompts || []
  }
}

export async function createEvent(event: Partial<Event>): Promise<Event> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// =====================================================
// Theme API Functions
// =====================================================

export async function updateEventTheme(eventId: string, theme: Partial<EventTheme>): Promise<EventTheme> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('event_themes')
    .upsert({ event_id: eventId, ...theme })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// =====================================================
// Prompt API Functions
// =====================================================

export async function fetchEventPrompts(eventId: string): Promise<EventPrompt[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('event_prompts')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order')
  
  if (error) throw error
  return data || []
}

export async function createPrompt(eventId: string, prompt: Partial<EventPrompt>): Promise<EventPrompt> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('event_prompts')
    .insert({ event_id: eventId, ...prompt })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updatePrompt(id: string, updates: Partial<EventPrompt>): Promise<EventPrompt> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('event_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deletePrompt(id: string): Promise<void> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('event_prompts')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// =====================================================
// Dashboard Stats
// =====================================================

export interface DashboardStats {
  total_events: number
  active_events: number
  total_images: number
  total_cost: number
  recent_images: Array<{
    id: string
    generated_image_url: string
    created_at: string
    event_id: string
  }>
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE}/api/dashboard/stats`)
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

// =====================================================
// Image Generation (Multi-tenant)
// =====================================================

export interface ImageGenerationRequest {
  image: string
  option: string
  eventSlug?: string
}

export interface ImageGenerationResponse {
  imageUrl: string
  qrCode: string | null
}

export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  const response = await fetch(`${API_BASE}/image-generator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Image generation failed')
  }
  
  return response.json()
}
