'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailPaypalMigration } from '@/lib/email'

export async function sendPaypalMigrationEmails(): Promise<{ sent: number; errors: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')

  const admin = createAdminClient()

  // Find all makers with paypal_email set but no stripe_account_id
  const { data: affected } = await admin
    .from('printer_profiles')
    .select('user_id, paypal_email')
    .not('paypal_email', 'is', null)
    .is('stripe_account_id', null)

  if (!affected || affected.length === 0) return { sent: 0, errors: [] }

  const userIds = affected.map((p) => p.user_id)
  const { data: emailRows } = await admin
    .from('profiles')
    .select('user_id, email')
    .in('user_id', userIds)

  const emailByUserId = Object.fromEntries((emailRows ?? []).map((r) => [r.user_id, r.email]))

  const errors: string[] = []
  let sent = 0

  for (const p of affected) {
    const email = emailByUserId[p.user_id]
    if (!email) { errors.push(`No email for user ${p.user_id}`); continue }
    try {
      await emailPaypalMigration({ to: email, paypalEmail: p.paypal_email as string })
      sent++
    } catch (err) {
      errors.push(`Failed to send to ${email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { sent, errors }
}
