"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/lib/api'
import Button from '@/components/UI/Button'
import { MdArrowBack } from 'react-icons/md'
import Link from 'next/link'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    company_name: '',
    logo_url: '',
    is_active: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const generateSlug = () => {
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setForm((prev) => ({ ...prev, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const event = await createEvent(form)
      router.push(`/dashboard/events/${event.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create event'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/events"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
        >
          <MdArrowBack className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={() => !form.slug && generateSlug()}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            placeholder="MECNO 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Slug *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              pattern="[a-z0-9-]+"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="mecno-2026"
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-4 py-2 text-sm text-gray-600 hover:text-green-600 border border-gray-300 rounded-xl hover:border-green-500 transition"
            >
              Generate
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            URL: /events/{form.slug || 'your-slug'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            placeholder="King Faisal Specialist Hospital"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
            placeholder="Optional event description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            name="logo_url"
            value={form.logo_url}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Activate event immediately
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="large"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
          <Link href="/dashboard/events" className="flex-1">
            <Button
              type="button"
              variant="tertiary"
              size="large"
              className="w-full"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
