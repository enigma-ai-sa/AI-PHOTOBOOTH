"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchEvents } from '@/lib/api'
import { Event } from '@/lib/supabase'

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const data = await fetchEvents(true) // Only active events
      setEvents(data)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light-green-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-light-green-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gradient-green-end mb-4">
          AI Photobooth
        </h1>
        <p className="text-center text-gray-600 mb-12">Select your event to get started</p>

        {events.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No active events at the moment</p>
            <p className="text-gray-400 mt-2">Please check back later</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl hover:scale-[1.02] transition group"
              >
                <div className="flex items-center gap-6">
                  {/* Logo */}
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {event.logo_url ? (
                      <img
                        src={event.logo_url}
                        alt={event.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-300">
                        {event.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition">
                      {event.name}
                    </h2>
                    <p className="text-gray-500">{event.company_name}</p>
                    {event.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent font-medium">
              enigma
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
