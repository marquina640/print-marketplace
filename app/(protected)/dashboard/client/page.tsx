import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Customer Dashboard' }

interface PageProps {
  searchParams: Promise<{ reviews?: string; cancelled?: string }>
}

export default async function ClientDashboardPage({ searchParams }: PageProps) {
  const { reviews, cancelled } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, display_name').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const viewMode = cookieStore.get('view_mode')?.value
  if (profile?.role !== 'client' && profile?.role !== 'admin' && viewMode !== 'client') redirect('/dashboard')

  // When admin previews as a specific user, use their ID for data queries
  const previewUserId = profile?.role === 'admin'
    ? cookieStore.get('admin_preview_user_id')?.value
    : undefined
  const effectiveUserId = previewUserId ?? user.id

  const { data: effectiveProfile } = previewUserId
    ? await supabase.from('profiles').select('display_name').eq('user_id', previewUserId).single()
    : { data: null }
  const displayName = effectiveProfile?.display_name ?? profile?.display_name

  const { data: jobs } = await supabase
    .from('jobs').select('*').eq('client_id', effectiveUserId)
    .order('created_at', { ascending: false })

  const jobIds = jobs?.map((j) => j.id) ?? []

  const { data: allQuotes } = jobIds.length > 0
    ? await supabase
        .from('quotes')
        .select('*, profiles:printer_id(display_name, email)')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const now = new Date()

  const openJobs      = jobs?.filter((j) => j.status === 'open') ?? []
  const activeJobs    = jobs?.filter((j) => ['paid', 'shipped', 'delivered', 'in_progress'].includes(j.status)) ?? []
  const completedJobs = jobs?.filter((j) => j.status === 'completed') ?? []

  // Fetch all reviews for delivered jobs to determine review state
  const reviewableJobIds = activeJobs.filter(j => j.status === 'delivered').map(j => j.id)
  const { data: allJobReviews } = reviewableJobIds.length > 0
    ? await supabase.from('reviews').select('job_id, reviewer_id').in('job_id', reviewableJobIds)
    : { data: [] }

  // Per job: has client reviewed? has other party reviewed?
  const reviewStateByJob = new Map<string, { clientReviewed: boolean; otherReviewed: boolean }>()
  for (const jobId of reviewableJobIds) {
    const jobReviews = allJobReviews?.filter(r => r.job_id === jobId) ?? []
    const clientReviewed = jobReviews.some(r => r.reviewer_id === effectiveUserId)
    const otherReviewed  = jobReviews.some(r => r.reviewer_id !== effectiveUserId)
    reviewStateByJob.set(jobId, { clientReviewed, otherReviewed })
  }

  // Jobs accepted but not yet paid
  const unpaidJobs = jobs?.filter((j) => j.status === 'accepted' && !(j as any).paid_at) ?? []
  const acceptedQuoteByJob = Object.fromEntries(
    (allQuotes?.filter((q) => q.status === 'accepted') ?? []).map((q) => [q.job_id, q])
  )

  // Group non-expired pending quotes by job
  const pendingQuotes = allQuotes?.filter((q) => {
    if (q.status !== 'pending') return false
    const exp = (q as any).expires_at
    return !exp || new Date(exp) > now
  }) ?? []
  const quotesByJob = pendingQuotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.job_id] = (acc[q.job_id] ?? 0) + 1
    return acc
  }, {})
  // Total quotes per job (all statuses) - so clients see total activity per request
  const totalQuotesByJob = (allQuotes ?? []).reduce<Record<string, number>>((acc, q) => {
    acc[q.job_id] = (acc[q.job_id] ?? 0) + 1
    return acc
  }, {})
  const jobsWithNewQuotes = openJobs.filter((j) => (quotesByJob[j.id] ?? 0) > 0)

  const stats = [
    { label: 'Active',       value: activeJobs.length,    color: 'text-emerald-600' },
    { label: 'Open',         value: openJobs.length,      color: 'text-ink-700'     },
    { label: 'Completed',    value: completedJobs.length, color: 'text-warm-500'    },
    { label: 'Total Requests', value: jobs?.length ?? 0,  color: 'text-warm-900'    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {cancelled === '1' && (
        <div className="rounded-xl bg-warm-100 border border-warm-300 px-5 py-4 flex items-center gap-3">
          <span className="text-xl">✓</span>
          <p className="text-sm text-warm-700">Your request has been cancelled.</p>
        </div>
      )}

      {reviews === 'pending' && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 px-5 py-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">⭐</span>
          <div>
            <p className="font-semibold text-amber-900">You have pending reviews</p>
            <p className="text-sm text-amber-700 mt-0.5">
              You have 3 or more completed jobs without a review. Leave your reviews below before posting a new request.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-heading">
            {displayName ? `Hey, ${displayName}` : 'My Dashboard'}
          </h1>
          <p className="text-warm-500 text-sm mt-0.5">Manage your 3D printing requests</p>
        </div>
        <Link href="/jobs/new"><Button variant="gold">+ Post a Request</Button></Link>
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

      {/* ── MISSING PAYMENT ALERT ── */}
      {unpaidJobs.length > 0 && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
            <h2 className="font-bold text-red-900">Payment required</h2>
          </div>
          <div className="space-y-2">
            {unpaidJobs.map((job) => {
              const quote = acceptedQuoteByJob[job.id]
              return (
                <div key={job.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-red-200">
                  <div>
                    <p className="font-semibold text-warm-900 text-sm">{job.title}</p>
                    {quote && (
                      <p className="text-xs text-warm-400 mt-0.5">
                        Quote accepted · <span className="font-semibold text-red-700">{formatCurrency(quote.price)} due</span>
                      </p>
                    )}
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="gold" size="sm">Pay Now →</Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── NEW QUOTES ALERT ── */}
      {jobsWithNewQuotes.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
            <h2 className="font-bold text-amber-900">
              You have quotes waiting for review!
            </h2>
          </div>
          <div className="space-y-2">
            {jobsWithNewQuotes.map((job) => (
              <div key={job.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-200">
                <div>
                  <p className="font-semibold text-warm-900 text-sm">{job.title}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{job.material}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5">
                    {quotesByJob[job.id]} quote{quotesByJob[job.id] !== 1 ? 's' : ''}
                  </span>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="gold" size="sm">Review Quotes →</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIVE JOBS ── */}
      {activeJobs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-warm-900 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            In Progress
          </h2>
          <div className="card divide-y divide-warm-100">
            {activeJobs.map((job) => {
              const reviewState = reviewStateByJob.get(job.id)
              const needsMyReview     = job.status === 'delivered' && reviewState && !reviewState.clientReviewed
              const waitingForMaker   = job.status === 'delivered' && reviewState && reviewState.clientReviewed && !reviewState.otherReviewed
              return (
                <div key={job.id} className="flex items-center justify-between p-4 hover:bg-warm-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-warm-900 truncate">{job.title}</p>
                    <p className="text-xs text-warm-400 mt-0.5">{job.material} · Due {formatDate(job.deadline)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    {needsMyReview && (
                      <span className="rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold px-2.5 py-0.5">
                        ⭐ Review missing
                      </span>
                    )}
                    {waitingForMaker && (
                      <span className="rounded-full bg-warm-100 border border-warm-200 text-warm-600 text-xs font-medium px-2.5 py-0.5">
                        Waiting for maker review
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/messages/${job.id}`}><Button variant="outline" size="sm">Message</Button></Link>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant={needsMyReview ? 'gold' : 'outline'} size="sm">
                          {needsMyReview ? 'Leave Review →' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── PENDING QUOTES ── */}
      {(() => {
        const pendingQuotesList = allQuotes?.filter((q) => q.status === 'pending') ?? []
        if (pendingQuotesList.length === 0) return null
        return (
          <section>
            <h2 className="text-lg font-semibold text-warm-900 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
              Quotes to Review
              <span className="ml-1 text-xs text-warm-400 font-normal">({pendingQuotesList.length})</span>
            </h2>
            <div className="card divide-y divide-warm-100">
              {pendingQuotesList.map((q) => {
                const printer = q.profiles as { display_name: string | null; email: string } | null
                const job = jobs?.find((j) => j.id === q.job_id)
                return (
                  <div key={q.id} className="flex items-center justify-between p-4 hover:bg-warm-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-warm-900 truncate">{job?.title}</p>
                      <p className="text-xs text-warm-400 mt-0.5">
                        From <span className="text-ink-700 font-medium">{printer?.display_name ?? printer?.email}</span>
                        {' · '}{formatDate(q.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-warm-900">{formatCurrency(q.price)}</p>
                        <p className="text-xs text-warm-400">{q.lead_time_days}d lead time</p>
                      </div>
                      <Link href={`/jobs/${q.job_id}`}>
                        <Button variant="gold" size="sm">Review →</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })()}

      {/* ── FIND YOUR MODEL ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-warm-900">Find your 3D model</h2>
            <p className="text-xs text-warm-400 mt-0.5">Browse free models, then post a request to get it printed</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* MakerWorld */}
          <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">MW</span>
              </div>
              <div>
                <p className="font-semibold text-warm-900">MakerWorld</p>
                <p className="text-xs text-warm-400">By Bambu Lab · millions of free models</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'All Models',    path: '/en' },
                { label: 'Home & Garden', path: '/en/search?keyword=home+garden' },
                { label: 'Miniatures',    path: '/en/search?keyword=miniatures'  },
                { label: 'Phone Cases',   path: '/en/search?keyword=phone+case'  },
                { label: 'Tools',         path: '/en/search?keyword=tools'       },
              ].map(({ label, path }) => (
                <a
                  key={label}
                  href={`https://makerworld.com${path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-700 hover:bg-ink-100 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <a
              href="https://makerworld.com/en"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto text-xs font-medium text-ink-600 hover:text-ink-800 flex items-center gap-1"
            >
              Open MakerWorld →
            </a>
          </div>

          {/* Thingiverse */}
          <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#248bfb] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">TV</span>
              </div>
              <div>
                <p className="font-semibold text-warm-900">Thingiverse</p>
                <p className="text-xs text-warm-400">By MakerBot · the classic 3D model library</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Popular',      path: '/search?q=&sort=popular&type=things' },
                { label: 'Gadgets',      path: '/search?q=gadgets&sort=popular&type=things' },
                { label: 'Toys & Games', path: '/search?q=toys+games&sort=popular&type=things' },
                { label: 'Art',          path: '/search?q=art&sort=popular&type=things' },
                { label: 'Tools',        path: '/search?q=tools&sort=popular&type=things' },
              ].map(({ label, path }) => (
                <a
                  key={label}
                  href={`https://www.thingiverse.com${path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <a
              href="https://www.thingiverse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto text-xs font-medium text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              Open Thingiverse →
            </a>
          </div>
        </div>
      </section>

      {/* ── ALL MY JOBS ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-warm-900">My Requests</h2>
          <Link href="/jobs/new" className="text-sm text-ink-600 hover:text-ink-700 font-medium">
            + New Request
          </Link>
        </div>

        {!jobs || jobs.length === 0 ? (
          <EmptyState
            icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            title="No jobs yet"
            description="Post your first request and start receiving quotes from local makers."
            action={{ label: 'Post a Request', href: '/jobs/new' }}
          />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const pendingCount = quotesByJob[job.id] ?? 0
              const totalCount   = totalQuotesByJob[job.id] ?? 0
              return (
                <div key={job.id} className="card flex items-center justify-between p-4 hover:bg-warm-50 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-warm-900 truncate">{job.title}</p>
                      {pendingCount > 0 && (
                        <span className="rounded-full bg-amber-500 text-white text-xs font-bold px-2 py-0.5 flex-shrink-0">
                          {pendingCount} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {job.material} · Posted {formatDate(job.created_at)}
                      {totalCount > 0 && (
                        <span className="ml-2 text-ink-600 font-medium">
                          · {totalCount} quote{totalCount !== 1 ? 's' : ''} received
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant={pendingCount > 0 ? 'gold' : 'outline'} size="sm">
                        {pendingCount > 0 ? `Review ${pendingCount} quote${pendingCount !== 1 ? 's' : ''}` : 'View'}
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
