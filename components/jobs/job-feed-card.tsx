import Link from 'next/link'
import { MaterialBadge, JobTypeBadge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/lib/types/database'

type Job = Database['public']['Tables']['jobs']['Row']

const JOB_TYPE_ICONS: Record<string, string> = {
  decorative:  '🎨',
  functional:  '⚙️',
  engineering: '🔧',
  production:  '🏭',
}

const MATERIAL_GRADIENTS: Record<string, string> = {
  'PLA':              'from-emerald-400 to-teal-500',
  'ABS':              'from-orange-400 to-amber-500',
  'PETG':             'from-sky-400 to-blue-500',
  'TPU':              'from-purple-400 to-violet-500',
  'ASA':              'from-yellow-400 to-amber-500',
  'Nylon':            'from-pink-400 to-rose-500',
  'Resin (Standard)': 'from-indigo-400 to-blue-600',
  'Resin (ABS-Like)': 'from-violet-400 to-purple-600',
  'Carbon Fiber PLA': 'from-warm-600 to-warm-800',
}

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
}

export function JobFeedCard({ job }: { job: Job }) {
  const gradient = MATERIAL_GRADIENTS[job.material] ?? 'from-ink-600 to-ink-800'
  const jobTypeIcon = (job as any).job_type ? JOB_TYPE_ICONS[(job as any).job_type] : '📦'

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <article className="rounded-2xl overflow-hidden border border-warm-200 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

        {/* Cover image or gradient */}
        <div className="relative h-48 overflow-hidden">
          {(job as any).image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(job as any).image_url}
              alt={job.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-5xl opacity-80">{jobTypeIcon}</span>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Budget pill — bottom left */}
          <div className="absolute bottom-3 left-3">
            <span className="rounded-xl bg-white/95 backdrop-blur-sm px-3 py-1 text-sm font-bold text-warm-900 shadow-sm">
              {formatCurrency(job.budget)}
            </span>
          </div>

          {/* NEW badge — top right */}
          {isNew(job.created_at) && (
            <div className="absolute top-3 right-3">
              <span className="rounded-lg bg-gold-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                NEW
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <MaterialBadge material={job.material} />
            {(job as any).job_type && <JobTypeBadge type={(job as any).job_type} />}
            {job.color && (
              <span className="inline-flex items-center rounded-full border border-warm-200 px-2 py-0.5 text-xs text-warm-500">
                {job.color}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-warm-900 leading-snug group-hover:text-ink-700 transition-colors line-clamp-2 mb-1">
            {job.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-warm-400 line-clamp-2 leading-relaxed mb-3">
            {job.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-warm-100">
            <div className="flex items-center gap-3 text-xs text-warm-400 flex-wrap">
              {job.location && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-warm-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="truncate max-w-[100px]">{job.location}</span>
                </span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-warm-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
              <span>Qty {job.quantity}</span>
            </div>

            <span className="flex-shrink-0 rounded-xl bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white group-hover:bg-gold-500 transition-colors">
              Quote →
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
