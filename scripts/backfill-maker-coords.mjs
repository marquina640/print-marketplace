// One-time script: geocode maker location strings that have no lat/lng
// Run with: node scripts/backfill-maker-coords.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function geocode(locationStr) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(locationStr)}&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'PrintMarketHub-backfill/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) return null
  const [lng, lat] = feature.geometry.coordinates
  const city =
    feature.properties.city ??
    feature.properties.town ??
    feature.properties.village ??
    feature.properties.name ??
    null
  return { lat, lng, city }
}

async function run() {
  // Fetch all makers with a location string but no coordinates
  // Diagnose: how many makers have machines
  const { data: allProfiles } = await supabase.from('printer_profiles').select('user_id')
  const { data: allMachines } = await supabase.from('machines').select('maker_id')
  const makerIdsWithMachines = new Set(allMachines?.map(m => m.maker_id) ?? [])
  const withMachines    = allProfiles?.filter(p => makerIdsWithMachines.has(p.user_id)).length ?? 0
  const withoutMachines = (allProfiles?.length ?? 0) - withMachines
  console.log(`Total printer_profiles: ${allProfiles?.length}`)
  console.log(`  Have at least one machine (visible on map): ${withMachines}`)
  console.log(`  No machine added (invisible on map): ${withoutMachines}`)

  const { data: makers, error } = await supabase
    .from('printer_profiles')
    .select('user_id, location, city, latitude, longitude')
    .not('location', 'is', null)
    .is('latitude', null)

  if (error) { console.error('Fetch error:', error.message); process.exit(1) }

  console.log(`Found ${makers.length} makers to geocode`)

  let updated = 0
  let failed = 0

  for (const maker of makers) {
    if (!maker.location?.trim()) { failed++; continue }

    const coords = await geocode(maker.location)

    if (!coords) {
      console.log(`  FAILED: ${maker.maker_id} — "${maker.location}"`)
      failed++
      continue
    }

    const updates = {
      latitude: coords.lat,
      longitude: coords.lng,
    }
    if (!maker.city && coords.city) updates.city = coords.city

    const { error: updateErr } = await supabase
      .from('printer_profiles')
      .update(updates)
      .eq('user_id', maker.user_id)

    if (updateErr) {
      console.log(`  UPDATE ERROR: ${maker.maker_id} — ${updateErr.message}`)
      failed++
    } else {
      console.log(`  OK: "${maker.location}" → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
      updated++
    }

    // Rate limit: Photon is free but be polite
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`)
}

run()
