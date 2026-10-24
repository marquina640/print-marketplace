'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailMakerNewJobNearby } from '@/lib/email'
import { redirect } from 'next/navigation'

const ADMIN_RADIUS_KM = 100

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function notifyMakersAdmin({
  jobId,
  jobLat,
  jobLng,
  jobTitle,
  jobMaterial,
  jobType,
}: {
  jobId: string
  jobLat: number | null
  jobLng: number | null
  jobTitle: string
  jobMaterial: string
  jobType: string
}): Promise<{ sent: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')

  if (!jobLat || !jobLng) return { sent: 0 }

  const admin = createAdminClient()
  const emailType = `job_alert_admin_${jobId}`

  const { data: makers } = await admin
    .from('printer_profiles')
    .select('user_id, display_name, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (!makers?.length) return { sent: 0 }

  const makerIds = makers.map((m) => m.user_id)

  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, email, is_test')
    .in('user_id', makerIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  const { data: alreadySent } = await admin
    .from('email_sends')
    .select('user_id')
    .eq('email_type', emailType)
    .in('user_id', makerIds)

  const alreadySentSet = new Set((alreadySent ?? []).map((r) => r.user_id))

  const newSends: { user_id: string; email_type: string }[] = []
  let sent = 0

  for (const maker of makers) {
    if (alreadySentSet.has(maker.user_id)) continue
    const p = profileMap.get(maker.user_id)
    if (!p?.email || p.is_test) continue

    const distKm = haversineKm(jobLat, jobLng, maker.latitude!, maker.longitude!)
    if (distKm > ADMIN_RADIUS_KM) continue

    emailMakerNewJobNearby({
      to: p.email,
      name: maker.display_name,
      jobTitle,
      jobMaterial,
      jobType,
      distanceKm: distKm,
      jobUrl: `/jobs/${jobId}`,
    }).catch(() => {})

    newSends.push({ user_id: maker.user_id, email_type: emailType })
    sent++
  }

  if (newSends.length > 0) {
    await admin.from('email_sends').upsert(newSends, { onConflict: 'user_id,email_type' })
  }

  return { sent }
}
