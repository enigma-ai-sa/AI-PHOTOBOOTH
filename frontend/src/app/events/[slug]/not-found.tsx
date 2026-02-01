import Link from 'next/link'
import Button from '@/components/UI/Button'

export default function EventNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-light-green-white p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gradient-green-end mb-4">404</h1>
        <h2 className="text-2xl font-medium text-gray-800 mb-2">Event Not Found</h2>
        <p className="text-gray-600 mb-8">
          This event doesn&apos;t exist or is not currently active.
        </p>
        <Link href="/events">
          <Button variant="primary" size="large">
            View All Events
          </Button>
        </Link>
      </div>
    </div>
  )
}
