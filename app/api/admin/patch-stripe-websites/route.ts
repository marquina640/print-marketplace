import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// One-time admin endpoint: adds business_profile.url to all connected accounts that are missing it.
// Call once from browser while logged in as admin, then this file can be deleted.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: rows } = await admin
    .from('printer_profiles')
    .select('stripe_account_id')
    .not('stripe_account_id', 'is', null)

  const accountIds = (rows ?? [])
    .map((r: any) => r.stripe_account_id as string)
    .filter(Boolean)

  const results: { id: string; status: string }[] = []

  for (const accountId of accountIds) {
    try {
      const account = await stripe.accounts.retrieve(accountId)
      const needsUrl = !account.business_profile?.url
      const needsType = !account.business_type
      if (needsUrl || needsType) {
        await stripe.accounts.update(accountId, {
          ...(needsType ? { business_type: 'individual' } : {}),
          ...(needsUrl ? { business_profile: { url: 'https://www.printmarkethub.com' } } : {}),
        })
        results.push({ id: accountId, status: 'patched' })
      } else {
        results.push({ id: accountId, status: 'already_set' })
      }
    } catch (e) {
      results.push({ id: accountId, status: `error: ${e instanceof Error ? e.message : String(e)}` })
    }
  }

  return NextResponse.json({ patched: results.filter(r => r.status === 'patched').length, results })
}
