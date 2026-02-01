import { createClient } from '@supabase/supabase-js'
import { EventProvider } from '@/contexts/EventContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { notFound } from 'next/navigation'
import { EventWithDetails } from '@/lib/supabase'

// Server-side Supabase client
function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getEventBySlug(slug: string): Promise<EventWithDetails | null> {
  const supabase = getServerSupabase()
  
  // Get event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
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

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  return (
    <EventProvider event={event}>
      <ThemeProvider theme={event.theme}>
        {children}
      </ThemeProvider>
    </EventProvider>
  )
}
