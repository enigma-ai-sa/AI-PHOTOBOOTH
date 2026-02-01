"use client"

import { createContext, useContext, ReactNode } from 'react'
import { EventWithDetails, EventTheme, EventPrompt } from '@/lib/supabase'

interface EventContextType {
  event: EventWithDetails
  theme: EventTheme | null
  prompts: EventPrompt[]
  getPromptOptions: () => Array<{
    id: string
    label: string
    image?: string
    option: string
  }>
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ 
  event, 
  children 
}: { 
  event: EventWithDetails
  children: ReactNode 
}) {
  const theme = event.theme
  const prompts = event.prompts || []

  const getPromptOptions = () => {
    return prompts
      .filter((p) => p.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map((p) => ({
        id: p.option_key,
        label: p.title,
        image: p.preview_image_url || undefined,
        option: p.option_key,
      }))
  }

  return (
    <EventContext.Provider value={{ event, theme, prompts, getPromptOptions }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEvent() {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider')
  }
  return context
}
