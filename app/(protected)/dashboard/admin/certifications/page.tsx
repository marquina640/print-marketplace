import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CertificationBadge } from '@/components/ui/badge'
import { CERTIFICATION_LEVELS, formatDate } from '@/lib/utils'
import { ReviewCard } from './review-card'

export const metadata = { title: 'Certification Review' }

export default async function AdminCertificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { data: pending },
    { data: reviewed },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase
      .from('certification_requests')
      .select('*, profiles:maker_id(display_name, email), printer_profiles:maker_id(city)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('certification_requests')
      .select('*, profiles:maker_id(display_name, email)')
      .in('status', ['approved', 'rejected', 'more_info'])
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('certification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('certification_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('certification_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  const pendingRequests = (pending ?? []).map((r) => {
    const p = r.profiles as { display_name: string | null; email: string } | null
    const pp = r.printer_profiles as { city: string } | null
    return {
      id:              r.id,
      maker_id:        r.maker_id,
      requested_level: r.requested_level,
      current_level:   r.current_level ?? 0,
      notes:           r.notes,
      photos:          r.photos ?? [],
      created_at:      r.created_at,
      maker_name:      p?.display_name ?? 'Unknown',
      maker_email:     p?.email ?? '',
      maker_city:      pp?.city ?? '—',
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-heading">Certification Review</h1>
          <p className="text-warm-500 text-sm mt-1">Review benchmark submissions and assign certification levels.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: pendingCount ?? 0, color: 'text-amber-600' },
          { label: 'Approved',       value: approvedCount ?? 0, color: 'text-emerald-600' },
          { label: 'Rejected',       value: rejectedCount ?? 0, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-warm-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending queue */}
      <section>
        <h2 className="text-lg font-bold text-ink-900 mb-4">
          Pending Review
          {(pendingCount ?? 0) > 0 && (
            <span className="ml-2 rounded-full bg-amber-500 text-white text-xs px-2 py-0.5">{pendingCount}</span>
          )}
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl mb-2">✓</p>
            <p className="font-semibold text-warm-900">Queue is clear</p>
            <p className="text-sm text-warm-500 mt-1">No certification requests pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <ReviewCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </section>

      {/* Recent reviewed */}
      {reviewed && reviewed.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-ink-900 mb-4">Recently Reviewed</h2>
          <div className="card divide-y divide-warm-100 overflow-hidden">
            {reviewed.map((r) => {
              const p = r.profiles as { display_name: string | null; email: string } | null
              const statusConfig: Record<string, string> = {
                approved:  'text-emerald-600',
                rejected:  'text-red-500',
                more_info: 'text-ink-600',
              }
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900 text-sm">{p?.display_name ?? p?.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CertificationBadge level={r.current_level ?? 0} size="sm" />
                      <span className="text-warm-400 text-xs">→</span>
                      <CertificationBadge level={r.requested_level} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold capitalize ${statusConfig[r.status] ?? 'text-warm-500'}`}>
                      {r.status === 'more_info' ? 'Info Requested' : r.status}
                    </span>
                    <span className="text-xs text-warm-400">{formatDate(r.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
