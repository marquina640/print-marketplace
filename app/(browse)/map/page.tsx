import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MapClient } from '@/components/map/map-client'
import { cityToCoords } from '@/lib/utils'

function scramble(id: string, lat: number, lng: number) {
  let h = 0
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0 }
  const r1 = ((h & 0xffff) / 0xffff - 0.5) * 2
  const r2 = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * 2
  const delta = 0.0009
  return { lat: lat + r1 * delta, lng: lng + r2 * delta }
}

export const metadata = { title: 'Map — PrintMarketHub' }

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let effectiveRole = 'client'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
    const cookieStore = await cookies()
    const previewAs = profile?.role === 'admin' ? cookieStore.get('admin_preview_as')?.value : undefined
    const viewMode = profile?.role !== 'admin' ? cookieStore.get('view_mode')?.value : undefined
    const viewModeRole = viewMode === 'maker' ? 'printer_owner' : viewMode === 'client' ? 'client' : null
    effectiveRole = previewAs ?? viewModeRole ?? profile?.role ?? 'client'
  }

  const { data: testUsers } = await supabase.from('profiles').select('user_id').eq('is_test', true)
  const testIds = testUsers?.map((u) => u.user_id) ?? []

  const { data: validMakerProfiles } = await supabase
    .from('profiles').select('user_id').eq('role', 'printer_owner').eq('is_test', false)
  const validMakerIds = validMakerProfiles?.map((p) => p.user_id) ?? []

  let jobsQuery = supabase.from('jobs')
    .select('id, title, material, budget, location, latitude, longitude')
    .eq('status', 'open')
  if (testIds.length > 0) jobsQuery = jobsQuery.not('client_id', 'in', `(${testIds.join(',')})`)
  if (user) jobsQuery = jobsQuery.neq('client_id', user.id)

  const visibleMakerIds = user ? validMakerIds.filter((id) => id !== user.id) : validMakerIds

  let printersQuery = supabase.from('printer_profiles')
    .select('user_id, display_name, city, certification_level, latitude, longitude')
  if (visibleMakerIds.length > 0) {
    printersQuery = printersQuery.in('user_id', visibleMakerIds)
  } else {
    printersQuery = printersQuery.eq('user_id', '00000000-0000-0000-0000-000000000000')
  }

  const [{ data: jobsRaw }, { data: printersRaw }] = await Promise.all([jobsQuery, printersQuery])

  const jobs = (jobsRaw ?? [])
    .map((j) => {
      const rawLat = j.latitude ?? cityToCoords(j.location)?.lat ?? null
      const rawLng = j.longitude ?? cityToCoords(j.location)?.lng ?? null
      if (rawLat == null || rawLng == null) return null
      const { lat, lng } = scramble(j.id, rawLat, rawLng)
      return { id: j.id as string, title: j.title as string, material: j.material as string, budget: j.budget as number, lat, lng }
    })
    .filter((j): j is NonNullable<typeof j> => j !== null)

  const printers = (printersRaw ?? [])
    .map((p) => {
      const rawLat = p.latitude ?? cityToCoords(p.city)?.lat ?? null
      const rawLng = p.longitude ?? cityToCoords(p.city)?.lng ?? null
      if (rawLat == null || rawLng == null) return null
      const { lat, lng } = scramble(p.user_id, rawLat, rawLng)
      return { id: p.user_id as string, display_name: p.display_name as string | null, city: p.city as string | null, certLevel: (p.certification_level as number) ?? 0, lat, lng }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  const showMode: 'jobs' | 'printers' | 'both' = !user ? 'both'
    : effectiveRole === 'client' ? 'printers'
    : effectiveRole === 'printer_owner' ? 'jobs'
    : 'both'

  const title = !user ? 'Makers & Open Requests'
    : effectiveRole === 'client' ? 'Makers Near You'
    : effectiveRole === 'printer_owner' ? 'Open Requests Near You'
    : 'Map'

  const subtitle = !user
    ? `${printers.length} maker${printers.length !== 1 ? 's' : ''} · ${jobs.length} open request${jobs.length !== 1 ? 's' : ''}`
    : effectiveRole === 'client'
    ? `${printers.length} maker${printers.length !== 1 ? 's' : ''} with addresses on the platform`
    : effectiveRole === 'printer_owner'
    ? `${jobs.length} open request${jobs.length !== 1 ? 's' : ''} in your area`
    : 'Open requests and makers around the world'

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="section-heading">{title}</h1>
        <p className="text-warm-500 text-sm mt-0.5">{subtitle}</p>
      </div>
      <MapClient jobs={jobs} printers={printers} defaultMode={showMode} />
    </div>
  )
}
