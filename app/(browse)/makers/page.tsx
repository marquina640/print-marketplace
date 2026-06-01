import { createClient } from '@/lib/supabase/server'
import { MakerCard } from '@/components/makers/maker-card'
import { CERTIFICATION_LEVELS, MANUFACTURING_PROCESSES } from '@/lib/utils'

export const metadata = { title: 'Browse Makers' }

interface PageProps {
  searchParams: Promise<{ cert?: string; city?: string; material?: string; process?: string; q?: string }>
}

export default async function MakersBrowsePage({ searchParams }: PageProps) {
  const { cert, city, material, process: processFilter, q } = await searchParams
  const supabase = await createClient()

  const { data: testUsers } = await supabase.from('profiles').select('user_id').eq('is_test', true)
  const testUserIds = testUsers?.map((u) => u.user_id) ?? []

  let profileQuery = supabase
    .from('printer_profiles')
    .select('user_id, display_name, city, certification_level, materials, processes, description')
    .order('certification_level', { ascending: false })

  if (testUserIds.length > 0) profileQuery = profileQuery.not('user_id', 'in', `(${testUserIds.join(',')})`)
  if (cert)          profileQuery = profileQuery.eq('certification_level', parseInt(cert))
  if (city)          profileQuery = profileQuery.ilike('city', `%${city}%`)
  if (material)      profileQuery = profileQuery.contains('materials', [material])
  if (processFilter) profileQuery = profileQuery.contains('processes', [processFilter])
  if (q)             profileQuery = profileQuery.ilike('display_name', `%${q}%`)

  const { data: makers, error } = await profileQuery
  const makerIds = makers?.map((m) => m.user_id) ?? []

  // Only show makers who have at least one machine registered
  const { data: machineRows } = makerIds.length > 0
    ? await supabase.from('machines').select('maker_id').in('maker_id', makerIds)
    : { data: [] }
  const makerIdsWithMachines = new Set((machineRows ?? []).map((r) => r.maker_id))
  const filteredMakerIds = makerIds.filter((id) => makerIdsWithMachines.has(id))

  const { data: portfolioItems } = filteredMakerIds.length > 0
    ? await supabase.from('portfolio_items').select('maker_id, image_url, is_featured')
        .in('maker_id', filteredMakerIds).order('is_featured', { ascending: false }).order('created_at', { ascending: false })
    : { data: [] }

  const { data: baseProfiles } = filteredMakerIds.length > 0
    ? await supabase.from('profiles').select('user_id, display_name, email, avatar_url').in('user_id', filteredMakerIds)
    : { data: [] }

  const { data: reviews } = filteredMakerIds.length > 0
    ? await supabase.from('reviews').select('reviewee_id, rating').in('reviewee_id', filteredMakerIds).eq('is_public', true)
    : { data: [] }

  const { data: completedQuotes } = filteredMakerIds.length > 0
    ? await supabase.from('quotes').select('printer_id, created_at, jobs!inner(created_at, status, material)')
        .in('printer_id', filteredMakerIds).eq('status', 'accepted').in('jobs.status', ['completed', 'delivered'])
    : { data: [] }

  interface MakerStats { completedCount: number; avgReplyHours: number | null; topMaterials: string[] }
  const statsByMaker: Record<string, MakerStats> = {}
  for (const qt of completedQuotes ?? []) {
    const job = (qt as any).jobs
    if (!statsByMaker[qt.printer_id]) statsByMaker[qt.printer_id] = { completedCount: 0, avgReplyHours: null, topMaterials: [] }
    const s = statsByMaker[qt.printer_id]
    s.completedCount++
    if (job?.created_at && qt.created_at) {
      const diffH = (new Date(qt.created_at).getTime() - new Date(job.created_at).getTime()) / 3600000
      if (diffH >= 0) s.avgReplyHours = s.avgReplyHours === null ? diffH : (s.avgReplyHours * (s.completedCount - 1) + diffH) / s.completedCount
    }
    if (job?.material && !s.topMaterials.includes(job.material)) s.topMaterials.push(job.material)
  }

  const coverByMaker: Record<string, string> = {}
  for (const item of portfolioItems ?? []) { if (!coverByMaker[item.maker_id]) coverByMaker[item.maker_id] = item.image_url }

  const profileByMaker: Record<string, { display_name: string | null; email: string; avatar_url: string | null }> = {}
  for (const p of baseProfiles ?? []) { profileByMaker[p.user_id] = { display_name: p.display_name, email: p.email, avatar_url: p.avatar_url } }

  const ratingByMaker: Record<string, { avg: number; count: number }> = {}
  for (const r of reviews ?? []) {
    const existing = ratingByMaker[r.reviewee_id]
    if (!existing) ratingByMaker[r.reviewee_id] = { avg: r.rating, count: 1 }
    else { existing.count++; existing.avg = (existing.avg * (existing.count - 1) + r.rating) / existing.count }
  }

  const enrichedMakers = (makers ?? []).filter((m) => makerIdsWithMachines.has(m.user_id)).map((m) => {
    const prof = profileByMaker[m.user_id]
    const rating = ratingByMaker[m.user_id]
    const stats = statsByMaker[m.user_id]
    return {
      user_id: m.user_id,
      display_name: m.display_name || prof?.display_name || prof?.email || 'Maker',
      city: m.city,
      certification_level: m.certification_level ?? 0,
      materials: m.materials ?? [],
      processes: (m.processes as string[] | null) ?? [],
      description: m.description,
      cover_image: coverByMaker[m.user_id] ?? null,
      avatar_url: prof?.avatar_url ?? null,
      rating_average: rating?.avg ?? null,
      rating_count: rating?.count ?? null,
      completed_count: stats?.completedCount ?? 0,
      avg_reply_hours: stats?.avgReplyHours ?? null,
      top_materials: stats?.topMaterials.slice(0, 2) ?? [],
    }
  })

  const hasFilters = !!(cert || city || material || processFilter || q)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Browse Makers</h1>
        <p className="text-warm-500 text-sm mt-1">
          Get your idea done by a real local maker —{' '}
          {enrichedMakers.length} maker{enrichedMakers.length !== 1 ? 's' : ''} on the platform
          {error && <span className="ml-2 text-red-400 text-xs">(query error: {error.message})</span>}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {(() => {
            const certBase = new URLSearchParams({ ...(city && { city }), ...(material && { material }), ...(processFilter && { process: processFilter }), ...(q && { q }) })
            return (
              <>
                <a href={`/makers?${certBase}`} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!cert ? 'bg-ink-900 text-white border-ink-900' : 'border-warm-300 text-warm-600 hover:border-ink-400'}`}>All levels</a>
                {CERTIFICATION_LEVELS.map((lvl) => {
                  const params = new URLSearchParams({ ...Object.fromEntries(certBase), cert: lvl.level.toString() })
                  return (
                    <a key={lvl.level} href={`/makers?${params}`}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${cert === lvl.level.toString() ? 'bg-ink-900 text-white border-ink-900' : 'border-warm-300 text-warm-600 hover:border-ink-400'}`}>
                      <span>{lvl.icon}</span>{lvl.shortName}
                    </a>
                  )
                })}
              </>
            )
          })()}
        </div>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const processBase = new URLSearchParams({ ...(cert && { cert }), ...(city && { city }), ...(material && { material }), ...(q && { q }) })
            const available = MANUFACTURING_PROCESSES.filter((p) => p.available)
            return (
              <>
                <a href={`/makers?${processBase}`} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!processFilter ? 'bg-gold-500 text-ink-900 border-gold-500' : 'border-warm-300 text-warm-600 hover:border-warm-400'}`}>All processes</a>
                {available.map((proc) => {
                  const params = new URLSearchParams({ ...Object.fromEntries(processBase), process: proc.value })
                  return (
                    <a key={proc.value} href={`/makers?${params}`}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${processFilter === proc.value ? 'bg-gold-500 text-ink-900 border-gold-500' : 'border-warm-300 text-warm-600 hover:border-warm-400'}`}>
                      {proc.label}
                    </a>
                  )
                })}
              </>
            )
          })()}
        </div>
      </div>

      <form className="card p-3 flex flex-wrap gap-2 items-center">
        <input name="q" defaultValue={q} placeholder="Search makers…"
          className="flex-1 min-w-[160px] rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-500/20" />
        <input name="city" defaultValue={city} placeholder="City (e.g. Zurich)"
          className="rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none w-40" />
        <input name="material" defaultValue={material} placeholder="Material (e.g. PLA)"
          className="rounded-xl border border-warm-300 bg-warm-50 px-3 py-2 text-sm focus:border-ink-500 focus:outline-none w-40" />
        {cert && <input type="hidden" name="cert" value={cert} />}
        {processFilter && <input type="hidden" name="process" value={processFilter} />}
        <button type="submit" className="rounded-xl bg-ink-800 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900 transition-colors">Search</button>
        {hasFilters && <a href="/makers" className="rounded-xl border border-warm-300 px-4 py-2 text-sm text-warm-600 hover:bg-warm-100 transition-colors">Clear</a>}
      </form>

      {enrichedMakers.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-semibold text-warm-900 mb-1">No makers found</h3>
          <p className="text-sm text-warm-500">
            {hasFilters ? 'Try adjusting your filters.' : 'No makers have completed their profile setup yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {enrichedMakers.map((maker) => <MakerCard key={maker.user_id} maker={maker} />)}
        </div>
      )}
    </div>
  )
}
