'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailOnboardingReminder } from '@/lib/email'

export async function sendOnboardingReminder(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorised')

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('profiles').select('email, display_name').eq('user_id', userId).single()
  if (!target?.email) throw new Error('User has no email')

  await emailOnboardingReminder({ to: target.email, name: target.display_name })
}
