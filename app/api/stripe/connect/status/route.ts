import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getConnectedAccountStatus } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const accountId = new URL(req.url).searchParams.get('accountId')
    if (!accountId) return NextResponse.json({ connected: false, detailsSubmitted: false })

    // Verify the accountId belongs to the requesting user before querying Stripe
    const admin = createAdminClient()
    const { data: pp } = await admin
      .from('printer_profiles')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()
    if ((pp as any)?.stripe_account_id !== accountId) {
      return NextResponse.json({ connected: false, detailsSubmitted: false })
    }

    const status = await getConnectedAccountStatus(accountId)
    const connected = status.chargesEnabled || status.payoutsEnabled

    // Sync DB so dashboard completeness reflects live Stripe status
    if (connected) {
      await admin
        .from('printer_profiles')
        .update({ stripe_onboarding_complete: true } as any)
        .eq('stripe_account_id', accountId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      connected,
      detailsSubmitted: status.detailsSubmitted,
    })
  } catch {
    return NextResponse.json({ connected: false, detailsSubmitted: false })
  }
}
