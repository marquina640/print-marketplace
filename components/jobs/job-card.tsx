import Link from 'next/link'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Database } from '@/lib/types/database'

type Job = Database['public']['Tables']['jobs']['Row'] & {
  profiles?: { display_name: string | null; email: string } | null
  _count?: { quotes: number }
}

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="card p-5 hover:border-indigo-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {job.title}
          </h3>
          <StatusBadge status={job.status} />
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="info">{job.material}</Badge>
          {job.color && <Badge>{job.color}</Badge>}
          {job.shipping_required && <Badge variant="warning">Shipping OK</Badge>}
          <Badge>Qty: {job.quantity}</Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            {job.budget && (
              <span className="font-medium text-gray-700">{formatCurrency(job.budget)}</span>
            )}
            {job.deadline && (
              <span>Due {formatDate(job.deadline)}</span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
            )}
          </div>
          <span className="text-gray-400">{formatDate(job.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
