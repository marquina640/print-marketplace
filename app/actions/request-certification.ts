'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitCertificationRequest(
  requestedLevel: number,
  notes: string,
  photos: string[],
  _ignoredClientLevel: number, // kept for backwards compat but never trusted
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'printer_owner' && profile?.role !== 'admin') throw new Error('Not a maker')

  if (requestedLevel < 1 || requestedLevel > 3) throw new Error('Invalid level')

  // Always fetch current level from the DB — never trust the caller-supplied value
  const { data: printerProfile } = await supabase
    .from('printer_profiles').select('certification_level').eq('user_id', user.id).single()
  const currentLevel = printerProfile?.certification_level ?? 0

  if (requestedLevel !== currentLevel + 1) throw new Error('Must apply for next level only')

  // Check no pending request exists
  const { data: existing } = await supabase
    .from('certification_requests')
    .select('id').eq('maker_id', user.id).eq('status', 'pending').single()

  if (existing) throw new Error('You already have a pending request. Wait for admin review.')

  const { error } = await supabase.from('certification_requests').insert({
    maker_id:        user.id,
    requested_level: requestedLevel,
    current_level:   currentLevel,
    notes:           notes.trim() || null,
    photos,
    status:          'pending',
  })

  if (error) throw new Error(error.message)
}
