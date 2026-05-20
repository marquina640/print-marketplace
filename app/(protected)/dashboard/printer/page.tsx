import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JobFeedCard } from '@/components/jobs/job-feed-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate, getCertificationLevel, CERTIFICATION_LEVELS } from '@/lib/utils'
import { CertificationBadge } from '@/components/ui/badge'

export const metadata = { title: 'Printer Dashboard' }

export default async function PrinterDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, display_name').eq('user_id', user.id).single()

  if (profile?.role !== 'printer_owner' && profile?.role !== 'admin') redirect('/dashboard')

  const cookieStore = await cookies()
  const previewUserId = profile?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined
  const effectiveUserId = previewUserId ?? user.id

  const { data: testUsers } = await supabase.from('profiles').select('user_id').eq('is_test', true)
  const testUserIds = testUsers?.map((u) => u.user_id) ?? []

  const recentJobsQuery = supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  const [
    { data: allMyQuotes },
    { data: recentJobs },
    { data: makerProfile },
  ] = await Promise.all([
    supabase
      .from('quotes')
      .select('*')
      .eq('printer_id', effectiveUserId)
      .order('created_at', { ascending: false }),
    testUserIds.length > 0
      ? recentJobsQuery.not('client_id', 'in', `(${testUserIds.join(',')})`)
      : recentJobsQuery,
    supabase
      .from('printer_profiles')
      .select('certification_level, display_name')
      .eq('user_id', effectiveUserId)
      .single(),
  ])

  // Fetch job details separately (avoid inner-join RLS issue where accepted jobs are filtered out)
  const quotedJobIds = [...new Set(allMyQuotes?.map((q) => q.job_id) ?? [])]
  const { data: quotedJobsList } = quotedJobIds.length > 0
    ? await supabase.from('jobs').select('id, title, deadline, material').in('id', quotedJobIds)
    : { data: [] }
  const quotedJobsById: Record<string, { id: string; title: string; deadline: string | null; material: string }> =
    Object.fromEntries((quotedJobsList ?? []).map((j) => [j.id, j]))

  // Split quotes by status
  const acceptedQuotes = allMyQuotes?.filter((q) => q.status === 'accepted') ?? []
  const pendingQuotes  = allMyQuotes?.filter((q) => q.status === 'pending')  ?? []

  const certLevel = makerProfile?.certification_level ?? 0
  const cert = getCertificationLevel(certLevel)
  const nextCert = certLevel < 3 ? CERTIFICATION_LEVELS[certLevel + 1] : null

  const stats = [
    { label: 'Active Jobs',   value: acceptedQuotes.length, color: 'text-emerald-600' },
    { label: 'Pending Quotes', value: pendingQuotes.length,  color: 'text-amber-600'   },
    { label: 'Total Quotes',  value: allMyQuotes?.length ?? 0, color: 'text-warm-900'  },
    { label: 'Open on Feed',  value: recentJobs?.length ?? 0, color: 'text-ink-700'    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">
            {(makerProfile?.display_name ?? profile?.display_name) ? `Hey, ${makerProfile?.display_name ?? profile?.display_name}` : 'Printer Dashboard'}
          </h1>
          <p className="text-warm-500 text-sm mt-0.5">Your jobs, quotes, and activity</p>
        </div>
        <Link href="/jobs"><Button variant="gold">Browse Requests</Button></Link>
      </div>

      {/* Certification panel */}
      <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-1">Certification Level</p>
            <CertificationBadge level={certLevel} size="lg" />
          </div>
          <div className="text-right">
            <p className="text-xs text-warm-400">Can quote on</p>
            <p className="text-sm font-semibold text-ink-800 mt-0.5">
              {certLevel === 0 ? 'Decorative · Functional'
              : certLevel === 1 ? 'Decorative · Functional · Engineering'
              : 'All job types'}
            </p>
          </div>
        </div>
        {nextCert && (
          <div className="px-6 py-3 bg-warm-50 flex items-center justify-between">
            <p className="text-xs text-warm-500">
              Next: <span className="font-semibold text-ink-800">{nextCert.name}</span> — {nextCert.description}
            </p>
            <Link href="/profile/certification">
              <Button variant="gold" size="sm">Apply for Level {certLevel + 1}</Button>
            </Link>
          </div>
        )}
        {certLevel === 3 && (
          <div className="px-6 py-3 bg-violet-50 text-xs text-violet-700 font-medium">
            ★ Maximum certification level reached
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-warm-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── ACTIVE JOBS (accepted quotes) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-warm-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Active Jobs
          </h2>
          {acceptedQuotes.length > 0 && (
            <span className="text-xs text-warm-400">{acceptedQuotes.length} job{acceptedQuotes.length !== 1 ? 's' : ''} to complete</span>
          )}
        </div>

        {acceptedQuotes.length === 0 ? (
          <EmptyState
            icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            title="No active jobs yet"
            description="When a customer accepts your quote, the request will appear here."
            action={{ label: 'Browse Open Requests', href: '/jobs' }}
          />
        ) : (
          <div className="card divide-y divide-warm-100">
            {acceptedQuotes.map((q) => {
              const job = quotedJobsById[q.job_id] ?? null
              return (
                <div key={q.id} className="flex items-center justify-between p-4 hover:bg-warm-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-warm-900 truncate">{job?.title}</p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {job?.material} · Due {formatDate(job?.deadline ?? null)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-warm-900">{formatCurrency(q.price)}</span>
                    <StatusBadge status="accepted" />
                    <div className="flex gap-2">
                      {job?.id && (
                        <Link href={`/messages/${job.id}`}>
                          <Button variant="outline" size="sm">Message</Button>
                        </Link>
                      )}
                      {job?.id && (
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm">View Job</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── MY QUOTES ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-warm-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
            My Quotes
            {(allMyQuotes?.length ?? 0) > 0 && (
              <span className="text-xs text-warm-400 font-normal">({allMyQuotes?.length} total)</span>
            )}
          </h2>
        </div>

        {!allMyQuotes || allMyQuotes.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold text-warm-900">No quotes sent yet</p>
            <p className="text-sm text-warm-500 mt-1">Browse open requests and submit your first quote.</p>
            <Link href="/jobs" className="inline-block mt-3">
              <Button variant="gold" size="sm">Browse Requests</Button>
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-warm-100">
            {allMyQuotes.map((q) => {
              const job = quotedJobsById[q.job_id] ?? null
              return (
                <div key={q.id} className="flex items-center justify-between p-4 hover:bg-warm-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-warm-900 truncate">{job?.title}</p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      Submitted {formatDate(q.created_at)}
                      {job?.deadline ? ` · Due ${formatDate(job.deadline)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-warm-900">{formatCurrency(q.price)}</p>
                      <p className="text-xs text-warm-400">{q.lead_time_days}d lead</p>
                    </div>
                    <StatusBadge status={q.status} />
                    {job?.id && (
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant={q.status === 'accepted' ? 'gold' : 'outline'} size="sm">
                          {q.status === 'accepted' ? 'Open Job' : 'View'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── RECENT OPEN JOBS ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-warm-900">New Requests on the Feed</h2>
          <Link href="/jobs" className="text-sm text-ink-600 hover:text-ink-700 font-medium">
            See all →
          </Link>
        </div>
        {!recentJobs || recentJobs.length === 0 ? (
          <p className="text-sm text-warm-500">No open requests right now.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentJobs.map((job) => <JobFeedCard key={job.id} job={job} />)}
          </div>
        )}
      </section>
    </div>
  )
}
