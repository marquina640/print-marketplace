import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createConnectedAccount, createConnectOnboardingLink, findConnectedAccountByEmail } from '@/lib/stripe'

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
      // Recover existing account by email before creating a new one
      const existing = await findConnectedAccountByEmail(profile?.email ?? '')
      accountId = existing ?? await createConnectedAccount(profile?.email ?? '')

      // Try to update an existing row first (avoids NOT NULL constraint on display_name/city)
      const { data: updated } = await admin
        .from('printer_profiles')
        .update({ stripe_account_id: accountId } as any)
        .eq('user_id', user.id)
        .select('user_id')

      // If no row exists yet, create a minimal one with required field placeholders
      if (!updated || updated.length === 0) {
        const { error: insertErr } = await admin.from('printer_profiles').insert({
          user_id:           user.id,
          display_name:      (profile?.email ?? '').split('@')[0],
          city:              '',
          stripe_account_id: accountId,
        } as any)
        if (insertErr) console.error('stripe onboard: failed to save stripe_account_id', insertErr.message)
      }
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
