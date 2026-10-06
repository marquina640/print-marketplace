'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { emailMakerNewJobNearby } from '@/lib/email'

const GLOBAL_RADIUS = 9999

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

export async function notifyNearbyMakers({
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
}) {
  if (!jobLat || !jobLng) return

  const admin = createAdminClient()
  const emailType = `job_alert_${jobId}`

  // Fetch makers who have alerts enabled with their email and location
  const { data: makers } = await admin
    .from('printer_profiles')
    .select('user_id, display_name, latitude, longitude, job_alert_radius_km')
    .not('job_alert_radius_km', 'is', null)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (!makers?.length) return

  const makerIds = makers.map((m) => m.user_id)

  // Fetch emails from profiles table
  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, email')
    .in('user_id', makerIds)

  const emailMap = new Map((profiles ?? []).map((p) => [p.user_id, p.email]))

  // Check which makers already got this alert
  const { data: alreadySent } = await admin
    .from('email_sends')
    .select('user_id')
    .eq('email_type', emailType)
    .in('user_id', makerIds)

  const alreadySentSet = new Set((alreadySent ?? []).map((r) => r.user_id))

  const newSends: { user_id: string; email_type: string }[] = []

  for (const maker of makers) {
    if (alreadySentSet.has(maker.user_id)) continue
    const email = emailMap.get(maker.user_id)
    if (!email) continue

    const radius = (maker as any).job_alert_radius_km as number
    const distKm = haversineKm(jobLat, jobLng, maker.latitude!, maker.longitude!)

    if (radius >= GLOBAL_RADIUS || distKm <= radius) {
      emailMakerNewJobNearby({
        to: email,
        name: maker.display_name,
        jobTitle,
        jobMaterial,
        jobType,
        distanceKm: distKm,
        jobUrl: `/jobs/${jobId}`,
      }).catch(() => {})

      newSends.push({ user_id: maker.user_id, email_type: emailType })
    }
  }

  if (newSends.length > 0) {
    await admin
      .from('email_sends')
      .upsert(newSends, { onConflict: 'user_id,email_type' })
  }
}
