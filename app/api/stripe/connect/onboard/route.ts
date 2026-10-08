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
      .select('stripe_account_id, country')
      .eq('user_id', user.id)
      .single()

    let accountId = (printerProfile as any)?.stripe_account_id as string | null
    const country = ((printerProfile as any)?.country as string | null) ?? 'CH'

    if (!accountId) {
      accountId = await createConnectedAccount(profile?.email ?? '', country)

      // Save to DB BEFORE redirecting — if this fails, abort so we don't lose the link
      const { data: updated } = await admin
        .from('printer_profiles')
        .update({ stripe_account_id: accountId } as any)
        .eq('user_id', user.id)
        .select('user_id')

      if (!updated || updated.length === 0) {
        // No printer_profiles row yet — create a minimal placeholder
        const { error: insertErr } = await admin.from('printer_profiles').insert({
          user_id:           user.id,
          display_name:      (profile?.email ?? '').split('@')[0],
          city:              '',
          stripe_account_id: accountId,
        } as any)

        if (insertErr) {
          // DB save failed — abort so the account ID isn't lost
          console.error('stripe onboard: failed to save stripe_account_id', insertErr.message)
          return NextResponse.json(
            { error: 'Could not save your Stripe account. Please complete your profile first, then connect Stripe.' },
            { status: 500 }
          )
        }
      }
    }

    const onboardingUrl = await createConnectOnboardingLink(
      accountId,
      `${appUrl}/profile/setup?stripe=success`,
      `${appUrl}/profile/setup?stripe=refresh`,
    )

    return NextResponse.json({ url: onboardingUrl })
  } catch (err) {
    console.error('Stripe Connect onboard error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Failed to start Stripe onboarding' }, { status: 500 })
  }
}
