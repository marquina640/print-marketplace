import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { JobFeedCard } from '@/components/jobs/job-feed-card'
import { MATERIALS, JOB_TYPES } from '@/lib/utils'

export const metadata = { title: 'Browse Requests' }

interface PageProps {
  searchParams: Promise<{ material?: string; q?: string; shipping?: string; job_type?: string; sort?: string }>
}

export default async function JobsFeedPage({ searchParams }: PageProps) {
  const { material, q, shipping, job_type, sort } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const viewMode = cookieStore.get('view_mode')?.value
  const effectiveRole = viewMode === 'client' ? 'client' : viewMode === 'maker' ? 'printer_owner' : profile?.role
  if (effectiveRole === 'client') redirect('/dashboard/client')

  // Get maker's certification level for smart matching indicator
  const { data: makerProfile } = await supabase
    .from('printer_profiles')
    .select('certification_level')
    .eq('user_id', user.id)
    .single()

  const makerLevel = makerProfile?.certification_level ?? 0

  const sortConfig: Record<string, { col: string; asc: boolean }> = {
    newest:   { col: 'created_at', asc: false },
    oldest:   { col: 'created_at', asc: true  },
    budget_hi:{ col: 'budget',     asc: false  },
    budget_lo:{ col: 'budget',     asc: true   },
    deadline: { col: 'deadline',   asc: true   },
  }
  const { col, asc } = sortConfig[sort ?? ''] ?? sortConfig.newest

  // Get test user IDs to exclude from the public feed
  const { data: testUsers } = await supabase.from('profiles').select('user_id').eq('is_test', true)
  const testUserIds = testUsers?.map((u) => u.user_id) ?? []

  let query = supabase
    .from('jobs').select('*')
    .eq('status', 'open')
    .order(col, { ascending: asc })

  if (testUserIds.length > 0) query = query.not('client_id', 'in', `(${testUserIds.join(',')})`)
  // Never show a maker their own requests in the feed
  query = query.neq('client_id', user.id)
  if (material) query = query.eq('material', material)
  if (q) query = query.ilike('title', `%${q}%`)
  if (shipping === '1') query = query.eq('shipping_required', true)
  if (job_type) query = query.eq('job_type', job_type)

  const { data: jobs } = await query

  const hasFilters = !!(material || q || shipping || job_type || sort)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-heading">Open Requests</h1>
          <p className="text-warm-500 text-sm mt-1">
            {jobs?.length ?? 0} request{jobs?.length !== 1 ? 's' : ''} waiting for a quote
          </p>
        </div>
        {/* Maker certification level */}
        <div className="text-right">
          <p className="text-xs text-warm-400 uppercase tracking-wider">Your level</p>
          <p className="text-sm font-semibold text-ink-800 mt-0.5">
            {makerLevel === 0 ? 'Community Maker'
            : makerLevel === 1 ? 'Verified Quality'
            : makerLevel === 2 ? 'Engineering Certified'
            : 'Production Partner'}
          </p>
        </div>
      </div>

      {/* Job type quick-filter pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/jobs"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !job_type ? 'bg-ink-900 text-white border-ink-900' : 'border-warm-300 text-warm-600 hover:border-ink-400'
          }`}
        >
          All types
        </Link>
        {JOB_TYPES.map((jt) => {
          const locked = jt.minCertLevel > makerLevel
          const active = job_type === jt.value
          const params = new URLSearchParams({ ...(material && { material }), ...(q && { q }), ...(shipping && { shipping }), job_type: jt.value })
          return (
            <Link
              key={jt.value}
              href={`/jobs?${params}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                active
                  ? 'bg-ink-900 text-white border-ink-900'
                  : locked
                  ? 'border-warm-200 text-warm-300 cursor-default'
                  : 'border-warm-300 text-warm-600 hover:border-ink-400 hover:text-ink-700'
              }`}
            >
              <span className="font-mono">{jt.icon}</span>
              {jt.label}
              {locked && <span className="text-[9px] ml-0.5">L{jt.minCertLevel}+</span>}
            </Link>
          )
        })}
      </div>

      {/* Filter bar */}
      <form className="card p-3 flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search requests…"
          className="flex-1 min-w-[160px] rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-500/20"
        />
        <select
          name="material"
          defaultValue={material ?? ''}
          className="rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none"
        >
          <option value="">All materials</option>
          {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-warm-600 cursor-pointer select-none">
          <input type="checkbox" name="shipping" value="1" defaultChecked={shipping === '1'}
            className="h-4 w-4 rounded border-warm-300 text-ink-600 focus:ring-ink-500" />
          Shipping OK
        </label>
        <select
          name="sort"
          defaultValue={sort ?? 'newest'}
          className="rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="budget_hi">Budget: high → low</option>
          <option value="budget_lo">Budget: low → high</option>
          <option value="deadline">Deadline: soonest</option>
        </select>
        {job_type && <input type="hidden" name="job_type" value={job_type} />}
        <button type="submit"
          className="rounded-xl bg-ink-800 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900 transition-colors">
          Filter
        </button>
        {hasFilters && (
          <Link href="/jobs"
            className="rounded-xl border border-warm-300 px-4 py-2 text-sm text-warm-600 hover:bg-warm-100 transition-colors">
            Clear
          </Link>
        )}
      </form>

      {/* Feed */}
      {!jobs || jobs.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-semibold text-warm-900 mb-1">No requests found</h3>
          <p className="text-sm text-warm-500">
            {hasFilters ? 'Try adjusting your filters.' : 'No open requests right now. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => <JobFeedCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  )
}
