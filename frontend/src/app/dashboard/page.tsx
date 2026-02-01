"use client"

import { useEffect, useState } from 'react'
import { fetchDashboardStats, DashboardStats } from '@/lib/api'
import { MdEvent, MdImage, MdAttachMoney, MdPlayCircle } from 'react-icons/md'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchDashboardStats()
      setStats(data)
    } catch (err) {
      setError('Failed to load dashboard stats')
      console.error(err)
    } finally {
      setLoading(false)
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Events"
          value={stats?.total_events || 0}
          icon={<MdEvent className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Active Events"
          value={stats?.active_events || 0}
          icon={<MdPlayCircle className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Images Generated"
          value={stats?.total_images || 0}
          icon={<MdImage className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Total Cost"
          value={`$${(stats?.total_cost || 0).toFixed(2)}`}
          icon={<MdAttachMoney className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Recent Images */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Generated Images</h2>
        
        {stats?.recent_images && stats.recent_images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stats.recent_images.map((image) => (
              <div key={image.id} className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={image.generated_image_url}
                  alt="Generated"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No images generated yet</p>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
