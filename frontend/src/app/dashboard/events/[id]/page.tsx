"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase, Event, EventTheme, EventPrompt } from '@/lib/supabase'
import { updateEvent, updateEventTheme, fetchEventPrompts, createPrompt, updatePrompt, deletePrompt } from '@/lib/api'
import Button from '@/components/UI/Button'
import { MdArrowBack, MdAdd, MdEdit, MdDelete, MdSave } from 'react-icons/md'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'theme' | 'prompts'>('details')

  const [event, setEvent] = useState<Event | null>(null)
  const [theme, setTheme] = useState<EventTheme | null>(null)
  const [prompts, setPrompts] = useState<EventPrompt[]>([])

  const [editingPrompt, setEditingPrompt] = useState<EventPrompt | null>(null)
  const [showPromptForm, setShowPromptForm] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    const supabase = getSupabase()

    try {
      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Load theme
      const { data: themeData } = await supabase
        .from('event_themes')
        .select('*')
        .eq('event_id', eventId)
        .single()

      setTheme(themeData)

      // Load prompts
      const promptsData = await fetchEventPrompts(eventId)
      setPrompts(promptsData)
    } catch (err) {
      setError('Failed to load event')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!event) return
    const { name, value, type } = e.target
    setEvent({
      ...event,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!theme) return
    setTheme({
      ...theme,
      [e.target.name]: e.target.value,
    })
  }

  const saveEvent = async () => {
    if (!event) return
    setSaving(true)
    setError(null)

    try {
      await updateEvent(eventId, {
        name: event.name,
        slug: event.slug,
        description: event.description,
        company_name: event.company_name,
        logo_url: event.logo_url,
        is_active: event.is_active,
      })
      alert('Event saved successfully!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save event'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const saveTheme = async () => {
    if (!theme) return
    setSaving(true)
    setError(null)

    try {
      await updateEventTheme(eventId, {
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        accent_color: theme.accent_color,
        background_gradient_start: theme.background_gradient_start,
        background_gradient_end: theme.background_gradient_end,
        font_family: theme.font_family,
      })
      alert('Theme saved successfully!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save theme'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Delete this prompt?')) return
    try {
      await deletePrompt(id)
      setPrompts(prompts.filter((p) => p.id !== id))
    } catch (err) {
      alert('Failed to delete prompt')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event not found</p>
        <Link href="/dashboard/events" className="text-green-600 hover:underline mt-2 inline-block">
          Back to Events
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/events"
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
        >
          <MdArrowBack className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-gray-500">/events/{event.slug}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['details', 'theme', 'prompts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
              <input
                type="text"
                name="name"
                value={event.name}
                onChange={handleEventChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
              <input
                type="text"
                name="slug"
                value={event.slug}
                onChange={handleEventChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              name="company_name"
              value={event.company_name}
              onChange={handleEventChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={event.description || ''}
              onChange={handleEventChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
            <input
              type="url"
              name="logo_url"
              value={event.logo_url || ''}
              onChange={handleEventChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={event.is_active}
              onChange={handleEventChange}
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Event is active
            </label>
          </div>

          <Button onClick={saveEvent} variant="primary" size="large" disabled={saving} className="gap-2">
            <MdSave className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Details'}
          </Button>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && theme && (
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="primary_color"
                  value={theme.primary_color}
                  onChange={handleThemeChange}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="primary_color"
                  value={theme.primary_color}
                  onChange={handleThemeChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="secondary_color"
                  value={theme.secondary_color}
                  onChange={handleThemeChange}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="secondary_color"
                  value={theme.secondary_color}
                  onChange={handleThemeChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="accent_color"
                  value={theme.accent_color || '#00a651'}
                  onChange={handleThemeChange}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="accent_color"
                  value={theme.accent_color || ''}
                  onChange={handleThemeChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
              <input
                type="text"
                name="font_family"
                value={theme.font_family || 'Alexandria'}
                onChange={handleThemeChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Start</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="background_gradient_start"
                  value={theme.background_gradient_start || '#007B3A'}
                  onChange={handleThemeChange}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="background_gradient_start"
                  value={theme.background_gradient_start || ''}
                  onChange={handleThemeChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gradient End</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="background_gradient_end"
                  value={theme.background_gradient_end || '#004d25'}
                  onChange={handleThemeChange}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  name="background_gradient_end"
                  value={theme.background_gradient_end || ''}
                  onChange={handleThemeChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div
              className="h-32 rounded-xl"
              style={{
                background: `linear-gradient(to bottom right, ${theme.background_gradient_start || '#007B3A'}, ${theme.background_gradient_end || '#004d25'})`,
              }}
            />
          </div>

          <Button onClick={saveTheme} variant="primary" size="large" disabled={saving} className="gap-2">
            <MdSave className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      )}

      {/* Prompts Tab */}
      {activeTab === 'prompts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingPrompt(null)
                setShowPromptForm(true)
              }}
              variant="primary"
              size="medium"
              className="gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Add Prompt
            </Button>
          </div>

          {prompts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No prompts yet. Add your first prompt to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{prompt.option_key}</code>
                        {!prompt.is_active && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{prompt.prompt_text}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPrompt(prompt)
                          setShowPromptForm(true)
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      >
                        <MdEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prompt Form Modal */}
          {showPromptForm && (
            <PromptFormModal
              prompt={editingPrompt}
              eventId={eventId}
              onClose={() => {
                setShowPromptForm(false)
                setEditingPrompt(null)
              }}
              onSaved={(savedPrompt) => {
                if (editingPrompt) {
                  setPrompts(prompts.map((p) => (p.id === savedPrompt.id ? savedPrompt : p)))
                } else {
                  setPrompts([...prompts, savedPrompt])
                }
                setShowPromptForm(false)
                setEditingPrompt(null)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function PromptFormModal({
  prompt,
  eventId,
  onClose,
  onSaved,
}: {
  prompt: EventPrompt | null
  eventId: string
  onClose: () => void
  onSaved: (prompt: EventPrompt) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    option_key: prompt?.option_key || '',
    title: prompt?.title || '',
    prompt_text: prompt?.prompt_text || '',
    preview_image_url: prompt?.preview_image_url || '',
    display_order: prompt?.display_order || 0,
    is_active: prompt?.is_active ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let saved: EventPrompt
      if (prompt) {
        saved = await updatePrompt(prompt.id, form)
      } else {
        saved = await createPrompt(eventId, form)
      }
      onSaved(saved)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save prompt'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{prompt ? 'Edit Prompt' : 'New Prompt'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Option Key *</label>
              <input
                type="text"
                name="option_key"
                value={form.option_key}
                onChange={handleChange}
                required
                pattern="[a-z0-9_-]+"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="bluebrains"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Blue Brains"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Text *</label>
            <textarea
              name="prompt_text"
              value={form.prompt_text}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter the AI generation prompt..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview Image URL</label>
            <input
              type="url"
              name="preview_image_url"
              value={form.preview_image_url}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
              <input
                type="number"
                name="display_order"
                value={form.display_order}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="primary" size="large" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : 'Save Prompt'}
            </Button>
            <Button type="button" variant="tertiary" size="large" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
