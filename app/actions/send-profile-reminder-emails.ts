'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailProfileIncomplete } from '@/lib/email'
import { STRIPE_CONNECT_COUNTRIES } from '@/lib/stripe'

export async function sendProfileReminderEmails(): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: adminProfile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if ((adminProfile as any)?.role !== 'admin') throw new Error('Not authorized')

  const admin = createAdminClient()

  const { data: makers } = await admin
    .from('profiles')
    .select('user_id, email, display_name')
    .eq('role', 'printer_owner')
    .eq('onboarding_complete', true) as { data: { user_id: string; email: string; display_name: string | null }[] | null }

  if (!makers || makers.length === 0) return { sent: 0, skipped: 0, errors: [] }

  const makerIds = makers.map((m) => m.user_id)

  const [{ data: ppRows }, { data: machineRows }] = await Promise.all([
    admin
      .from('printer_profiles')
      .select('user_id, display_name, country, materials, stripe_account_id, stripe_onboarding_complete, paypal_email')
      .in('user_id', makerIds) as unknown as Promise<{ data: any[] | null }>,
    admin
      .from('machines')
      .select('maker_id')
      .in('maker_id', makerIds)
      .eq('is_active', true) as unknown as Promise<{ data: any[] | null }>,
  ])

  const ppByUser: Record<string, any> = Object.fromEntries((ppRows ?? []).map((p) => [p.user_id, p]))
  const hasMachines = new Set((machineRows ?? []).map((m) => m.maker_id))

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const maker of makers) {
    const pp = ppByUser[maker.user_id]
    const missingItems: string[] = []

    if (!pp?.display_name) missingItems.push('Display name')
    if (!pp?.country) missingItems.push('Country')
    if (!pp?.materials || (pp.materials as string[]).length === 0) missingItems.push('Materials (at least one)')
    if (!hasMachines.has(maker.user_id)) missingItems.push('Printer / machine')

    const usesPayPal = !!pp?.country && !STRIPE_CONNECT_COUNTRIES.has(pp.country as string)
    const hasPayment = usesPayPal
      ? !!pp?.paypal_email
      : !!pp?.stripe_account_id
    if (!hasPayment) {
      missingItems.push(usesPayPal ? 'PayPal email for payouts' : 'Stripe account for payouts')
    }

    if (missingItems.length === 0) { skipped++; continue }
    if (!maker.email) { errors.push(`No email for ${maker.user_id}`); continue }

    try {
      await emailProfileIncomplete({
        to: maker.email,
        name: pp?.display_name ?? maker.display_name,
        missingItems,
      })
      sent++
    } catch (err) {
      errors.push(`${maker.email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { sent, skipped, errors }
}
