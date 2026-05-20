import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MapClient } from '@/components/map/map-client'
import { cityToCoords } from '@/lib/utils'

export const metadata = { title: 'Map — PrintMarketHub' }

export default async function MapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  const cookieStore = await cookies()
  const previewAs = profile?.role === 'admin'
    ? cookieStore.get('admin_preview_as')?.value
    : undefined
  const viewMode = profile?.role !== 'admin' ? cookieStore.get('view_mode')?.value : undefined
  const viewModeRole = viewMode === 'maker' ? 'printer_owner' : viewMode === 'client' ? 'client' : null
  const effectiveRole = previewAs ?? viewModeRole ?? profile?.role ?? 'client'

  // Get IDs of valid (non-test, non-deleted) makers from profiles
  const { data: validMakerProfiles } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'printer_owner')
    .eq('is_test', false)
  const validMakerIds = validMakerProfiles?.map((p) => p.user_id) ?? []

  const { data: testUsers } = await supabase.from('profiles').select('user_id').eq('is_test', true)
  const testIds = testUsers?.map((u) => u.user_id) ?? []

  let jobsQuery = supabase
    .from('jobs')
    .select('id, title, material, budget, location, latitude, longitude')
    .eq('status', 'open')
  if (testIds.length > 0) jobsQuery = jobsQuery.not('client_id', 'in', `(${testIds.join(',')})`)

  // Only show printer_profiles whose user still has an active, non-test profile
  let printersQuery = supabase
    .from('printer_profiles')
    .select('user_id, display_name, city, certification_level, latitude, longitude')
  if (validMakerIds.length > 0) {
    printersQuery = printersQuery.in('user_id', validMakerIds)
  } else {
    printersQuery = printersQuery.eq('user_id', '00000000-0000-0000-0000-000000000000')
  }

  const [{ data: jobsRaw }, { data: printersRaw }] = await Promise.all([jobsQuery, printersQuery])

  const jobs = (jobsRaw ?? [])
    .map((j) => {
      const lat = j.latitude ?? cityToCoords(j.location)?.lat ?? null
      const lng = j.longitude ?? cityToCoords(j.location)?.lng ?? null
      if (lat == null || lng == null) return null
      return { id: j.id as string, title: j.title as string, material: j.material as string, budget: j.budget as number, lat, lng }
    })
    .filter((j): j is NonNullable<typeof j> => j !== null)

  const printers = (printersRaw ?? [])
    .map((p) => {
      const lat = p.latitude ?? cityToCoords(p.city)?.lat ?? null
      const lng = p.longitude ?? cityToCoords(p.city)?.lng ?? null
      if (lat == null || lng == null) return null
      return { id: p.user_id as string, display_name: p.display_name as string | null, city: p.city as string | null, certLevel: (p.certification_level as number) ?? 0, lat, lng }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  // Clients see makers only; makers see jobs only; admins see both
  const showMode: 'jobs' | 'printers' | 'both' =
    effectiveRole === 'client' ? 'printers'
    : effectiveRole === 'printer_owner' ? 'jobs'
    : 'both'

  const title = effectiveRole === 'client' ? 'Makers Near You'
    : effectiveRole === 'printer_owner' ? 'Open Requests Near You'
    : 'Map'

  const subtitle = effectiveRole === 'client'
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
