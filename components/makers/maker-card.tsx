import Link from 'next/link'
import { CertificationBadge } from '@/components/ui/badge'

const PROCESS_LABELS: Record<string, string> = {
  fdm:        'FDM',
  resin:      'Resin',
  sls:        'SLS',
  cnc:        'CNC',
  laser:      'Laser',
  sheet_metal:'Sheet Metal',
  other:      'Other',
}

const CERT_GRADIENTS = [
  'from-warm-400 to-warm-600',
  'from-sky-400 to-blue-600',
  'from-gold-400 to-amber-600',
  'from-violet-500 to-purple-700',
]

interface MakerCardProps {
  maker: {
    user_id: string
    display_name: string | null
    city: string | null
    certification_level: number
    materials: string[] | null
    rating_average: number | null
    rating_count: number | null
    description: string | null
    processes: string[]
    cover_image: string | null
    avatar_url: string | null
    completed_count?: number
    avg_reply_hours?: number | null
    top_materials?: string[]
  }
}

function formatReplyTime(hours: number): string {
  if (hours < 1) return 'under an hour'
  if (hours < 24) return `~${Math.round(hours)}h`
  const days = Math.round(hours / 24)
  return `~${days} day${days !== 1 ? 's' : ''}`
}

export function MakerCard({ maker }: MakerCardProps) {
  const name = maker.display_name ?? 'Maker'
  const certLevel = maker.certification_level ?? 0
  const gradient = CERT_GRADIENTS[certLevel] ?? CERT_GRADIENTS[0]
  const topMaterials = (maker.materials ?? []).slice(0, 3)
  const rating = maker.rating_average ?? 0
  const ratingCount = maker.rating_count ?? 0
  const completedCount = maker.completed_count ?? 0
  const avgReplyHours = maker.avg_reply_hours ?? null
  const topDoneMaterials = maker.top_materials ?? []
  const showStats = completedCount >= 5

  return (
    <Link href={`/makers/${maker.user_id}`} className="block group">
      <article className="rounded-2xl overflow-hidden border border-warm-200 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

        {/* Cover */}
        <div className="relative h-44 overflow-hidden">
          {maker.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={maker.cover_image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              {maker.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={maker.avatar_url} alt={name}
                  className="h-20 w-20 rounded-full object-cover border-4 border-white/30 shadow-lg" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          )}

          {/* Dark overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Cert badge - bottom left */}
          <div className="absolute bottom-3 left-3">
            <CertificationBadge level={certLevel} size="sm" />
          </div>

          {/* Rating - bottom right */}
          {ratingCount > 0 && (
            <div className="absolute bottom-3 right-3">
              <span className="rounded-lg bg-white/95 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-warm-900 flex items-center gap-1 shadow-sm">
                <span className="text-gold-500">★</span>
                {rating.toFixed(1)}
                <span className="text-warm-400 font-normal">({ratingCount})</span>
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-warm-900 group-hover:text-ink-700 transition-colors leading-tight">
              {name}
            </h3>
          </div>

          {/* Location */}
          {maker.city && (
            <p className="flex items-center gap-1 text-xs text-warm-400 mb-3">
              <svg className="h-3.5 w-3.5 text-warm-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {maker.city}
            </p>
          )}

          {/* Processes */}
          {maker.processes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {maker.processes.map((p) => (
                <span key={p} className="rounded-lg bg-ink-50 border border-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">
                  {PROCESS_LABELS[p] ?? p}
                </span>
              ))}
            </div>
          )}

          {/* Materials */}
          {topMaterials.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {topMaterials.map((m) => (
                <span key={m} className="rounded-full border border-warm-200 bg-warm-50 px-2 py-0.5 text-xs text-warm-600">
                  {m}
                </span>
              ))}
              {(maker.materials?.length ?? 0) > 3 && (
                <span className="rounded-full border border-warm-200 bg-warm-50 px-2 py-0.5 text-xs text-warm-400">
                  +{(maker.materials?.length ?? 0) - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats (only after 5+ completed projects) */}
          {showStats && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-warm-500">
              <span>{completedCount} completed</span>
              {avgReplyHours !== null && (
                <span>Replies in {formatReplyTime(avgReplyHours)}</span>
              )}
              {topDoneMaterials.length > 0 && (
                <span>Mostly {topDoneMaterials.join(' & ')}</span>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="pt-3 border-t border-warm-100">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700 group-hover:text-gold-600 transition-colors">
              View Profile
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
