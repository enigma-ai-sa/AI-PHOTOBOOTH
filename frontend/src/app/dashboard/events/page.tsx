"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchEvents, deleteEvent } from '@/lib/api'
import { Event } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/UI/Button'
import { MdAdd, MdEdit, MdDelete, MdPlayCircle, MdStop } from 'react-icons/md'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin } = useAuth()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const data = await fetchEvents()
      setEvents(data)
    } catch (err) {
      setError('Failed to load events')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await deleteEvent(id)
      setEvents(events.filter((e) => e.id !== id))
    } catch (err) {
      alert('Failed to delete event')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        {isAdmin && (
          <Link href="/dashboard/events/new">
            <Button variant="primary" size="medium" className="gap-2">
              <MdAdd className="w-5 h-5" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">No events yet</p>
          {isAdmin && (
            <Link href="/dashboard/events/new">
              <Button variant="primary" size="medium">Create Your First Event</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-6"
            >
              {/* Logo */}
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {event.logo_url ? (
                  <img
                    src={event.logo_url}
                    alt={event.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">
                    {event.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                  {event.is_active ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      <MdPlayCircle className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <MdStop className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{event.company_name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Slug: <code className="bg-gray-100 px-1 rounded">{event.slug}</code>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/events/${event.slug}`}
                  target="_blank"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition"
                >
                  Preview
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    >
                      <MdEdit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
