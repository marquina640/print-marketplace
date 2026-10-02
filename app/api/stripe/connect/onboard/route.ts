import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createConnectedAccount, createConnectOnboardingLink } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin  = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const { data: profile } = await admin.from('profiles').select('email').eq('user_id', user.id).single()

    // Get or create connected account
    const { data: printerProfile } = await admin
      .from('printer_profiles')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    let accountId = (printerProfile as any)?.stripe_account_id as string | null

    if (!accountId) {
      accountId = await createConnectedAccount(profile?.email ?? '')
      await admin.from('printer_profiles').upsert({ user_id: user.id, stripe_account_id: accountId } as any, { onConflict: 'user_id' })
    }

    const onboardingUrl = await createConnectOnboardingLink(
      accountId,
      `${appUrl}/profile/setup?stripe=success`,
      `${appUrl}/profile/setup?stripe=refresh`,
    )

    return NextResponse.json({ url: onboardingUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stripe Connect onboard error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
