'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailOnboardingReminder } from '@/lib/email'

export async function sendOnboardingReminderBulk(): Promise<{ sent: number; errors: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorised')

  const admin = createAdminClient()

  const { data: targets } = await admin
    .from('profiles')
    .select('user_id, email, display_name')
    .eq('onboarding_complete', false)
    .neq('role', 'admin')

  if (!targets || targets.length === 0) return { sent: 0, errors: [] }

  let sent = 0
  const errors: string[] = []

  for (const t of targets) {
    if (!t.email) { errors.push(`No email for ${t.user_id}`); continue }
    try {
      await emailOnboardingReminder({ to: t.email, name: t.display_name })
      sent++
    } catch (err) {
      errors.push(`${t.email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { sent, errors }
}
