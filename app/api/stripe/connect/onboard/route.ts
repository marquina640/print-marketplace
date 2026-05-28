import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const admin  = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Get or create Stripe Express account for this maker
    const { data: printerProfile } = await admin
      .from('printer_profiles')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    let accountId = printerProfile?.stripe_account_id as string | undefined

    if (!accountId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single()

      const account = await stripe.accounts.create({
        type: 'express',
        email: profile?.email,
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
      })

      accountId = account.id

      await admin
        .from('printer_profiles')
        .update({ stripe_account_id: accountId, stripe_onboarding_complete: false } as any)
        .eq('user_id', user.id)
    }

    // Generate a fresh onboarding link every time
    const link = await stripe.accountLinks.create({
      account:     accountId,
      refresh_url: `${appUrl}/dashboard/printer?stripe=refresh`,
      return_url:  `${appUrl}/api/stripe/connect/return?account=${accountId}`,
      type:        'account_onboarding',
    })

    return NextResponse.json({ url: link.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stripe Connect onboard error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
