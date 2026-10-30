import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: rows } = await admin
    .from('printer_profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .not('stripe_account_id', 'is', null)

  const results: { id: string; status: string }[] = []

  for (const row of rows ?? []) {
    const accountId = (row as any).stripe_account_id as string
    try {
      const account = await stripe.accounts.retrieve(accountId)
      const complete = account.details_submitted && (account.charges_enabled || account.payouts_enabled)
      const wasComplete = !!(row as any).stripe_onboarding_complete

      if (complete && !wasComplete) {
        await admin
          .from('printer_profiles')
          .update({ stripe_onboarding_complete: true } as any)
          .eq('stripe_account_id', accountId)
        results.push({ id: accountId, status: 'updated' })
      } else {
        results.push({ id: accountId, status: complete ? 'already_complete' : 'not_ready' })
      }
    } catch (e) {
      results.push({ id: accountId, status: `error: ${e instanceof Error ? e.message : String(e)}` })
    }
  }

  return NextResponse.json({ total: results.length, results })
}
